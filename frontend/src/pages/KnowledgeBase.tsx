import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import {
  Psychology,
  Search,
  Article,
  VideoLibrary,
  Quiz,
  School,
  TrendingUp,
  ExpandMore,
  Add,
  Edit,
  Visibility,
  ThumbUp,
  Comment,
  BookmarkBorder,
  HelpOutline,
} from '@mui/icons-material';

const KnowledgeBase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data for knowledge base
  const categories = [
    { id: 'all', name: 'All Categories', count: 45, icon: <Article />, color: '#2196f3' },
    { id: 'trading', name: 'Trading Basics', count: 12, icon: <TrendingUp />, color: '#4caf50' },
    { id: 'strategies', name: 'AI Strategies', count: 8, icon: <Psychology />, color: '#9c27b0' },
    { id: 'tutorials', name: 'Video Tutorials', count: 15, icon: <VideoLibrary />, color: '#f44336' },
    { id: 'faq', name: 'FAQ', count: 10, icon: <HelpOutline />, color: '#ff9800' },
  ];

  const articles = [
    {
      id: 1,
      title: 'Getting Started with AI Trading Bots',
      description: 'Learn how to set up your first automated trading bot with our step-by-step guide.',
      category: 'Trading Basics',
      type: 'article',
      views: 1234,
      likes: 89,
      comments: 23,
      difficulty: 'Beginner',
      readTime: '5 min',
      lastUpdated: '2024-01-15',
    },
    {
      id: 2,
      title: 'Understanding Risk Management in Algorithmic Trading',
      description: 'Deep dive into risk management strategies and how to protect your portfolio.',
      category: 'AI Strategies',
      type: 'article',
      views: 987,
      likes: 67,
      comments: 15,
      difficulty: 'Intermediate',
      readTime: '8 min',
      lastUpdated: '2024-01-14',
    },
    {
      id: 3,
      title: 'Broker API Integration Tutorial',
      description: 'Step-by-step video guide on connecting your broker account safely.',
      category: 'Video Tutorials',
      type: 'video',
      views: 2341,
      likes: 156,
      comments: 34,
      difficulty: 'Beginner',
      readTime: '12 min',
      lastUpdated: '2024-01-13',
    },
    {
      id: 4,
      title: 'Common Trading Bot Issues and Solutions',
      description: 'Troubleshoot the most common problems users encounter with trading bots.',
      category: 'FAQ',
      type: 'faq',
      views: 3456,
      likes: 234,
      comments: 78,
      difficulty: 'All Levels',
      readTime: '6 min',
      lastUpdated: '2024-01-12',
    },
  ];

  const popularFAQs = [
    {
      question: 'How do I connect my broker account?',
      answer: 'Navigate to Settings > Broker Integration and follow the secure API connection process...',
      category: 'Setup',
    },
    {
      question: 'Why is my trading bot not executing orders?',
      answer: 'Check your API permissions, account balance, and strategy settings. Ensure your broker account...',
      category: 'Troubleshooting',
    },
    {
      question: 'What are the subscription tier differences?',
      answer: 'Basic tier includes 1 bot, Pro tier includes 3 bots with advanced strategies, Elite tier...',
      category: 'Billing',
    },
    {
      question: 'How can I track my bot\'s performance?',
      answer: 'Use the Analytics dashboard to monitor returns, drawdown, win rate, and other key metrics...',
      category: 'Analytics',
    },
  ];

  const kbMetrics = {
    totalArticles: 45,
    totalViews: 12567,
    avgRating: 4.6,
    newThisWeek: 3,
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'error';
      default: return 'info';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoLibrary />;
      case 'faq': return <HelpOutline />;
      case 'quiz': return <Quiz />;
      default: return <Article />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f7fa',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1,
              }}
            >
              Knowledge Base
            </Typography>
            <Typography variant="h6" sx={{ color: '#374151', fontWeight: 400 }}>
              Comprehensive help center and documentation
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              background: 'rgba(255,255,255,0.2)',
              
              color: '#1F2937',
              '&:hover': {
                background: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            New Article
          </Button>
        </Box>

        {/* Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.3)', mr: 2 }}>
                    <Article sx={{ color: '#1F2937' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                      {kbMetrics.totalArticles}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Total Articles
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.3)', mr: 2 }}>
                    <Visibility sx={{ color: '#1F2937' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                      {kbMetrics.totalViews.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Total Views
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255, 193, 7, 0.3)', mr: 2 }}>
                    <ThumbUp sx={{ color: '#1F2937' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                      {kbMetrics.avgRating}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Avg Rating
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.3)', mr: 2 }}>
                    <School sx={{ color: '#1F2937' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700 }}>
                      {kbMetrics.newThisWeek}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      New This Week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Categories */}
        <Card
          sx={{
            background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
            mb: 4,
          }}
        >
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search articles, tutorials, and FAQs..."
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#1F2937',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                  },
                }}
              />
            </Box>

            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} md={2.4} key={category.id}>
                  <Card
                    onClick={() => setSelectedCategory(category.id)}
                    sx={{
                      background: selectedCategory === category.id 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'rgba(255,255,255,0.05)',
                      
                      border: selectedCategory === category.id 
                        ? '2px solid rgba(255,255,255,0.3)' 
                        : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.15)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: category.color,
                          width: 40,
                          height: 40,
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        {category.icon}
                      </Avatar>
                      <Typography variant="body2" sx={{ color: '#1F2937', fontWeight: 600, mb: 0.5 }}>
                        {category.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                        {category.count} items
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Articles and Tutorials */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Featured Articles & Tutorials
                </Typography>
                
                <Grid container spacing={3}>
                  {articles.map((article) => (
                    <Grid item xs={12} key={article.id}>
                      <Card
                        sx={{
                          background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid #e0e0e0',
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32, mr: 2 }}>
                                {getTypeIcon(article.type)}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ color: '#1F2937', fontWeight: 600 }}>
                                  {article.title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Chip
                                    label={article.category}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255,255,255,0.2)',
                                      color: '#1F2937',
                                      fontSize: '0.7rem',
                                    }}
                                  />
                                  <Chip
                                    label={article.difficulty}
                                    size="small"
                                    color={getDifficultyColor(article.difficulty) as any}
                                  />
                                  <Chip
                                    label={article.readTime}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255,255,255,0.1)',
                                      color: '#1F2937',
                                      fontSize: '0.7rem',
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton size="small" sx={{ color: '#6B7280' }}>
                                <BookmarkBorder />
                              </IconButton>
                              <IconButton size="small" sx={{ color: '#6B7280' }}>
                                <Edit />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" sx={{ color: '#374151', mb: 2 }}>
                            {article.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Visibility sx={{ fontSize: '1rem', color: '#9CA3AF' }} />
                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                  {article.views}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ThumbUp sx={{ fontSize: '1rem', color: '#9CA3AF' }} />
                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                  {article.likes}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Comment sx={{ fontSize: '1rem', color: '#9CA3AF' }} />
                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                  {article.comments}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                              Updated: {article.lastUpdated}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Popular FAQs */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                
                border: '1px solid #e0e0e0',
                borderRadius: '16px',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: '#1F2937', mb: 3, fontWeight: 600 }}>
                  Popular FAQs
                </Typography>
                
                <Box>
                  {popularFAQs.map((faq, index) => (
                    <Accordion
                      key={index}
                      sx={{
                        background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        mb: 1,
                        '&:before': { display: 'none' },
                        '& .MuiAccordionSummary-root': {
                          color: '#1F2937',
                          '& .MuiAccordionSummary-expandIconWrapper': {
                            color: '#1F2937',
                          },
                        },
                        '& .MuiAccordionDetails-root': {
                          color: '#374151',
                        },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {faq.question}
                          </Typography>
                          <Chip
                            label={faq.category}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: '#1F2937',
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2">
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default KnowledgeBase;