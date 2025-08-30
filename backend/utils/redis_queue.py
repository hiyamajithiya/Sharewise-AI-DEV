"""
Redis-based task queue system for ShareWise AI
Handles asynchronous trading operations, notifications, and background tasks
"""

import json
import time
import uuid
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass
from enum import Enum

try:
    import redis
    from django_redis import get_redis_connection
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from django.conf import settings

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Priority(Enum):
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3


@dataclass
class Task:
    id: str
    queue: str
    task_type: str
    data: Dict[str, Any]
    priority: Priority
    created_at: datetime
    scheduled_at: Optional[datetime] = None
    attempts: int = 0
    max_attempts: int = 3
    status: TaskStatus = TaskStatus.PENDING
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'queue': self.queue,
            'task_type': self.task_type,
            'data': self.data,
            'priority': self.priority.value,
            'created_at': self.created_at.isoformat(),
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'attempts': self.attempts,
            'max_attempts': self.max_attempts,
            'status': self.status.value,
            'error_message': self.error_message,
            'result': self.result
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        return cls(
            id=data['id'],
            queue=data['queue'],
            task_type=data['task_type'],
            data=data['data'],
            priority=Priority(data['priority']),
            created_at=datetime.fromisoformat(data['created_at']),
            scheduled_at=datetime.fromisoformat(data['scheduled_at']) if data['scheduled_at'] else None,
            attempts=data['attempts'],
            max_attempts=data['max_attempts'],
            status=TaskStatus(data['status']),
            error_message=data['error_message'],
            result=data['result']
        )


class RedisQueue:
    """Redis-based task queue with priority support"""
    
    def __init__(self, queue_name: str = "default"):
        if not REDIS_AVAILABLE:
            raise ImportError("Redis is required for queue functionality")
        
        self.queue_name = queue_name
        self.redis_conn = get_redis_connection("default")
        
        # Queue keys
        self.pending_key = f"queue:{queue_name}:pending"
        self.processing_key = f"queue:{queue_name}:processing"
        self.completed_key = f"queue:{queue_name}:completed"
        self.failed_key = f"queue:{queue_name}:failed"
        self.tasks_key = f"queue:{queue_name}:tasks"
        
    def enqueue(
        self,
        task_type: str,
        data: Dict[str, Any],
        priority: Priority = Priority.NORMAL,
        delay_seconds: int = 0,
        max_attempts: int = 3
    ) -> str:
        """
        Add task to queue
        
        Args:
            task_type: Type of task to execute
            data: Task data
            priority: Task priority
            delay_seconds: Delay before task becomes available
            max_attempts: Maximum retry attempts
        
        Returns:
            Task ID
        """
        task_id = str(uuid.uuid4())
        
        scheduled_at = None
        if delay_seconds > 0:
            scheduled_at = datetime.now() + timedelta(seconds=delay_seconds)
        
        task = Task(
            id=task_id,
            queue=self.queue_name,
            task_type=task_type,
            data=data,
            priority=priority,
            created_at=datetime.now(),
            scheduled_at=scheduled_at,
            max_attempts=max_attempts
        )
        
        # Store task details
        self.redis_conn.hset(self.tasks_key, task_id, json.dumps(task.to_dict()))
        
        # Add to pending queue with priority score
        if scheduled_at:
            # Scheduled tasks go to a separate sorted set
            scheduled_key = f"queue:{self.queue_name}:scheduled"
            self.redis_conn.zadd(scheduled_key, {task_id: scheduled_at.timestamp()})
        else:
            # Immediate tasks go to pending queue
            priority_score = priority.value * 1000000 + int(time.time())
            self.redis_conn.zadd(self.pending_key, {task_id: priority_score})
        
        logger.info(f"Enqueued task {task_id} of type {task_type} in queue {self.queue_name}")
        return task_id
    
    def dequeue(self, timeout: int = 10) -> Optional[Task]:
        """
        Get next task from queue (blocking)
        
        Args:
            timeout: Timeout in seconds
        
        Returns:
            Task object or None if timeout
        """
        # First, move any scheduled tasks that are ready
        self._move_scheduled_tasks()
        
        # Get highest priority task from pending queue
        result = self.redis_conn.bzpopmax(self.pending_key, timeout=timeout)
        
        if not result:
            return None
        
        _, task_id, _ = result
        task_id = task_id.decode('utf-8') if isinstance(task_id, bytes) else task_id
        
        # Get task details
        task_data = self.redis_conn.hget(self.tasks_key, task_id)
        if not task_data:
            logger.warning(f"Task {task_id} not found in tasks hash")
            return None
        
        task = Task.from_dict(json.loads(task_data))
        
        # Move to processing
        task.status = TaskStatus.PROCESSING
        self.redis_conn.hset(self.tasks_key, task_id, json.dumps(task.to_dict()))
        self.redis_conn.sadd(self.processing_key, task_id)
        
        logger.debug(f"Dequeued task {task_id} from queue {self.queue_name}")
        return task
    
    def complete_task(self, task_id: str, result: Optional[Dict[str, Any]] = None) -> bool:
        """
        Mark task as completed
        
        Args:
            task_id: Task ID
            result: Task result data
        
        Returns:
            True if successful
        """
        task_data = self.redis_conn.hget(self.tasks_key, task_id)
        if not task_data:
            return False
        
        task = Task.from_dict(json.loads(task_data))
        task.status = TaskStatus.COMPLETED
        task.result = result
        
        # Update task and move to completed
        self.redis_conn.hset(self.tasks_key, task_id, json.dumps(task.to_dict()))
        self.redis_conn.srem(self.processing_key, task_id)
        self.redis_conn.sadd(self.completed_key, task_id)
        
        logger.info(f"Completed task {task_id}")
        return True
    
    def fail_task(self, task_id: str, error_message: str, retry: bool = True) -> bool:
        """
        Mark task as failed
        
        Args:
            task_id: Task ID
            error_message: Error description
            retry: Whether to retry the task
        
        Returns:
            True if successful
        """
        task_data = self.redis_conn.hget(self.tasks_key, task_id)
        if not task_data:
            return False
        
        task = Task.from_dict(json.loads(task_data))
        task.attempts += 1
        task.error_message = error_message
        
        # Remove from processing
        self.redis_conn.srem(self.processing_key, task_id)
        
        if retry and task.attempts < task.max_attempts:
            # Retry with exponential backoff
            delay = min(300, 2 ** task.attempts)  # Max 5 minutes
            task.scheduled_at = datetime.now() + timedelta(seconds=delay)
            task.status = TaskStatus.PENDING
            
            # Add back to scheduled queue
            scheduled_key = f"queue:{self.queue_name}:scheduled"
            self.redis_conn.zadd(scheduled_key, {task_id: task.scheduled_at.timestamp()})
            
            logger.info(f"Retrying task {task_id} in {delay} seconds (attempt {task.attempts})")
        else:
            # Max attempts reached or no retry
            task.status = TaskStatus.FAILED
            self.redis_conn.sadd(self.failed_key, task_id)
            
            logger.warning(f"Task {task_id} failed after {task.attempts} attempts: {error_message}")
        
        self.redis_conn.hset(self.tasks_key, task_id, json.dumps(task.to_dict()))
        return True
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID"""
        task_data = self.redis_conn.hget(self.tasks_key, task_id)
        if not task_data:
            return None
        
        return Task.from_dict(json.loads(task_data))
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        return {
            'queue': self.queue_name,
            'pending': self.redis_conn.zcard(self.pending_key),
            'processing': self.redis_conn.scard(self.processing_key),
            'completed': self.redis_conn.scard(self.completed_key),
            'failed': self.redis_conn.scard(self.failed_key),
            'scheduled': self.redis_conn.zcard(f"queue:{self.queue_name}:scheduled"),
            'total_tasks': self.redis_conn.hlen(self.tasks_key)
        }
    
    def _move_scheduled_tasks(self):
        """Move scheduled tasks that are ready to pending queue"""
        scheduled_key = f"queue:{self.queue_name}:scheduled"
        now = time.time()
        
        # Get tasks ready to run
        ready_tasks = self.redis_conn.zrangebyscore(scheduled_key, 0, now)
        
        for task_id in ready_tasks:
            task_id = task_id.decode('utf-8') if isinstance(task_id, bytes) else task_id
            
            # Get task to determine priority
            task_data = self.redis_conn.hget(self.tasks_key, task_id)
            if task_data:
                task = Task.from_dict(json.loads(task_data))
                
                # Move to pending with priority
                priority_score = task.priority.value * 1000000 + int(time.time())
                self.redis_conn.zadd(self.pending_key, {task_id: priority_score})
                
                # Remove from scheduled
                self.redis_conn.zrem(scheduled_key, task_id)
    
    def clear_completed(self, older_than_hours: int = 24):
        """Clear completed tasks older than specified hours"""
        completed_tasks = self.redis_conn.smembers(self.completed_key)
        cutoff_time = datetime.now() - timedelta(hours=older_than_hours)
        
        cleared_count = 0
        for task_id in completed_tasks:
            task_id = task_id.decode('utf-8') if isinstance(task_id, bytes) else task_id
            task = self.get_task(task_id)
            
            if task and task.created_at < cutoff_time:
                self.redis_conn.srem(self.completed_key, task_id)
                self.redis_conn.hdel(self.tasks_key, task_id)
                cleared_count += 1
        
        logger.info(f"Cleared {cleared_count} completed tasks older than {older_than_hours} hours")
        return cleared_count


class TaskProcessor:
    """Process tasks from Redis queues"""
    
    def __init__(self, queue_name: str = "default"):
        self.queue = RedisQueue(queue_name)
        self.handlers: Dict[str, Callable] = {}
        self.running = False
    
    def register_handler(self, task_type: str, handler: Callable):
        """Register task handler function"""
        self.handlers[task_type] = handler
        logger.info(f"Registered handler for task type: {task_type}")
    
    def process_tasks(self, timeout: int = 10):
        """Process tasks from queue (blocking)"""
        self.running = True
        
        while self.running:
            try:
                task = self.queue.dequeue(timeout=timeout)
                if not task:
                    continue
                
                self._process_task(task)
                
            except KeyboardInterrupt:
                logger.info("Task processor stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in task processor: {e}")
    
    def stop(self):
        """Stop processing tasks"""
        self.running = False
    
    def _process_task(self, task: Task):
        """Process individual task"""
        handler = self.handlers.get(task.task_type)
        if not handler:
            error_msg = f"No handler registered for task type: {task.task_type}"
            logger.error(error_msg)
            self.queue.fail_task(task.id, error_msg, retry=False)
            return
        
        try:
            logger.info(f"Processing task {task.id} of type {task.task_type}")
            result = handler(task.data)
            self.queue.complete_task(task.id, result)
            
        except Exception as e:
            error_msg = f"Task handler failed: {str(e)}"
            logger.error(f"Task {task.id} failed: {error_msg}")
            self.queue.fail_task(task.id, error_msg)


# Predefined queues for different purposes
class Queues:
    TRADING = "trading"          # Trading orders, signals
    NOTIFICATIONS = "notifications"  # Email, SMS, push notifications  
    ANALYTICS = "analytics"      # Data processing, reporting
    ML_TRAINING = "ml_training"  # ML model training
    MARKET_DATA = "market_data"  # Market data processing
    MAINTENANCE = "maintenance"  # System maintenance tasks


# Global queue instances
trading_queue = RedisQueue(Queues.TRADING) if REDIS_AVAILABLE else None
notifications_queue = RedisQueue(Queues.NOTIFICATIONS) if REDIS_AVAILABLE else None
analytics_queue = RedisQueue(Queues.ANALYTICS) if REDIS_AVAILABLE else None
ml_queue = RedisQueue(Queues.ML_TRAINING) if REDIS_AVAILABLE else None
market_data_queue = RedisQueue(Queues.MARKET_DATA) if REDIS_AVAILABLE else None


def get_queue(queue_name: str) -> Optional[RedisQueue]:
    """Get queue instance by name"""
    if not REDIS_AVAILABLE:
        return None
    
    return RedisQueue(queue_name)


def enqueue_trading_task(task_type: str, data: Dict[str, Any], priority: Priority = Priority.NORMAL) -> Optional[str]:
    """Enqueue trading-related task"""
    if trading_queue:
        return trading_queue.enqueue(task_type, data, priority)
    return None


def enqueue_notification(task_type: str, data: Dict[str, Any], delay_seconds: int = 0) -> Optional[str]:
    """Enqueue notification task"""
    if notifications_queue:
        return notifications_queue.enqueue(task_type, data, Priority.HIGH, delay_seconds)
    return None