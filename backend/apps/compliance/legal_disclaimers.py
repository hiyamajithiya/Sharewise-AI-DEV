"""
Legal Disclaimers and Documentation System for SEBI Compliance
Manages all legal disclaimers, terms of service, and regulatory disclosures
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from django.template.loader import render_to_string

User = get_user_model()
logger = logging.getLogger(__name__)


class LegalDisclaimerManager:
    """Manage legal disclaimers and regulatory disclosures"""
    
    def __init__(self):
        self.sebi_registration = "INH000000000"  # Replace with actual SEBI registration
        self.company_name = "ShareWise AI Technologies Private Limited"
        self.registered_address = "Your Registered Office Address"
        self.contact_details = {
            'phone': '+91-XXXXXXXXXX',
            'email': 'compliance@sharewise.ai',
            'website': 'https://sharewise.ai'
        }
    
    def get_investment_adviser_disclosure(self) -> Dict[str, Any]:
        """Get SEBI Investment Adviser disclosure"""
        return {
            'title': 'Investment Adviser Disclosure',
            'sebi_registration': self.sebi_registration,
            'company_name': self.company_name,
            'disclosure_text': f"""
SEBI INVESTMENT ADVISER DISCLOSURE

{self.company_name} (the "Company") is registered with the Securities and Exchange Board of India ("SEBI") as an Investment Adviser under the SEBI (Investment Advisers) Regulations, 2013.

SEBI Registration Number: {self.sebi_registration}
Registered Office: {self.registered_address}
Contact: {self.contact_details['phone']} | {self.contact_details['email']}

IMPORTANT DISCLOSURES:

1. NATURE OF SERVICES:
   - The Company provides investment advice through algorithmic models and artificial intelligence
   - All recommendations are based on quantitative analysis and historical data
   - Past performance does not guarantee future results

2. REGULATORY COMPLIANCE:
   - The Company is regulated by SEBI under Investment Adviser regulations
   - All activities are conducted in accordance with SEBI guidelines
   - Client funds are never handled directly by the Investment Adviser

3. RISK WARNINGS:
   - All investments in securities markets are subject to market risks
   - AI-generated recommendations may not account for all market factors
   - Clients should read all scheme related documents carefully before investing

4. CONFLICTS OF INTEREST:
   - The Company does not engage in proprietary trading
   - No commissions are received from third parties for recommendations
   - Complete conflict of interest policy is available on our website

5. GRIEVANCE REDRESSAL:
   - For complaints, contact: {self.contact_details['email']}
   - Unresolved grievances can be escalated to SEBI SCORES portal
   - Response time: 7 working days for most complaints

This disclosure is in accordance with SEBI (Investment Advisers) Regulations, 2013.
            """,
            'effective_date': '2024-01-01',
            'last_updated': timezone.now().date().isoformat(),
            'version': '1.0'
        }
    
    def get_terms_of_service(self) -> Dict[str, Any]:
        """Get comprehensive terms of service"""
        return {
            'title': 'Terms of Service',
            'effective_date': '2024-01-01',
            'last_updated': timezone.now().date().isoformat(),
            'version': '2.0',
            'content': f"""
TERMS OF SERVICE - {self.company_name}

Last Updated: {timezone.now().date().isoformat()}

1. ACCEPTANCE OF TERMS
By accessing or using ShareWise AI platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.

2. DESCRIPTION OF SERVICES
ShareWise AI provides:
- Algorithmic trading recommendations using artificial intelligence
- Portfolio analysis and risk management tools
- Market research and educational content
- Investment advisory services (SEBI registered)

3. ELIGIBILITY
- Users must be at least 18 years old
- Must be resident of India with valid PAN card
- Must complete KYC verification as per SEBI requirements
- Must have necessary experience for derivative trading (if applicable)

4. USER RESPONSIBILITIES
- Provide accurate and complete information during registration
- Maintain confidentiality of login credentials
- Comply with all applicable securities laws
- Use services only for personal investment purposes
- Report any unauthorized access immediately

5. INVESTMENT RISKS
- All investments carry risk of loss including potential loss of principal
- Past performance does not guarantee future results
- AI recommendations are based on historical data and may not predict future market movements
- Users should diversify investments and not rely solely on automated recommendations
- Derivative trading involves high risk and is suitable only for experienced investors

6. SEBI COMPLIANCE
- We are registered with SEBI as Investment Adviser (Registration: {self.sebi_registration})
- All advisory activities comply with SEBI (Investment Advisers) Regulations, 2013
- We do not guarantee returns or provide assured returns
- We do not handle client funds directly

7. DATA PRIVACY
- Personal data is processed in accordance with our Privacy Policy
- KYC data is stored securely and shared only as required by regulations
- Trading data is anonymized for research and model improvement
- Users have right to access, correct, and delete personal data

8. FEES AND CHARGES
- Advisory fees are clearly disclosed before service commencement
- No hidden charges or commissions from third parties
- Fees are subject to applicable taxes
- Refund policy is available on our website

9. INTELLECTUAL PROPERTY
- All AI models, algorithms, and software are proprietary to ShareWise AI
- Users receive limited license to use the platform for personal investment purposes
- Reverse engineering or copying of algorithms is prohibited

10. LIMITATION OF LIABILITY
- Services provided "as is" without warranties
- We are not liable for investment losses resulting from market risks
- Maximum liability limited to fees paid by user in last 12 months
- Force majeure events may suspend services without liability

11. TERMINATION
- Either party may terminate services with 30 days notice
- We may suspend services immediately for regulatory non-compliance
- Upon termination, user access is revoked but data retained as per regulations

12. DISPUTE RESOLUTION
- Disputes subject to arbitration in [City], India
- Arbitration conducted under Indian Arbitration and Conciliation Act, 2015
- Courts of [City] have exclusive jurisdiction

13. AMENDMENTS
- Terms may be updated to reflect regulatory changes
- Users will be notified 30 days before material changes
- Continued use constitutes acceptance of modified terms

14. GOVERNING LAW
These terms are governed by Indian law and SEBI regulations.

15. CONTACT INFORMATION
For questions about these terms:
Email: {self.contact_details['email']}
Phone: {self.contact_details['phone']}
Address: {self.registered_address}
            """,
            'acceptance_required': True,
            'regulatory_basis': 'SEBI (Investment Advisers) Regulations, 2013'
        }
    
    def get_privacy_policy(self) -> Dict[str, Any]:
        """Get privacy policy in compliance with data protection laws"""
        return {
            'title': 'Privacy Policy',
            'effective_date': '2024-01-01',
            'last_updated': timezone.now().date().isoformat(),
            'version': '1.0',
            'content': f"""
PRIVACY POLICY - {self.company_name}

Last Updated: {timezone.now().date().isoformat()}

1. INTRODUCTION
This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use ShareWise AI platform.

2. INFORMATION WE COLLECT

a) Personal Information:
- Name, address, phone number, email address
- PAN number, Aadhaar details (as required for KYC)
- Bank account details for fund transfers
- Investment experience and risk profile
- Income and net worth information

b) Trading Information:
- Investment preferences and objectives
- Trading history and portfolio details
- Risk tolerance and investment patterns
- Platform usage and interaction data

c) Technical Information:
- IP address, device information, browser type
- Log files and usage analytics
- Cookies and similar tracking technologies

3. HOW WE USE YOUR INFORMATION

a) Service Provision:
- Complete KYC verification as per SEBI requirements
- Provide personalized investment recommendations
- Execute trades and manage portfolios
- Send trade confirmations and account statements

b) Regulatory Compliance:
- Comply with SEBI reporting requirements
- Maintain audit trails and transaction records
- Report suspicious transactions to authorities
- Respond to regulatory inquiries

c) Business Operations:
- Improve AI models and algorithms
- Analyze market trends and user behavior
- Develop new products and services
- Prevent fraud and unauthorized access

4. INFORMATION SHARING AND DISCLOSURE

We may share your information with:

a) Regulatory Authorities:
- SEBI, RBI, Income Tax Department
- Stock exchanges and depositories
- Other authorities as required by law

b) Service Providers:
- KYC verification agencies
- Banks and payment processors
- Technology service providers
- Auditors and compliance consultants

c) Legal Requirements:
- Court orders and legal processes
- Law enforcement investigations
- Prevention of fraud or crime

We do NOT sell personal information to third parties.

5. DATA SECURITY

a) Technical Safeguards:
- AES-256 encryption for sensitive data
- Secure transmission protocols (TLS)
- Multi-factor authentication
- Regular security audits and penetration testing

b) Administrative Safeguards:
- Access controls and user permissions
- Employee background checks and training
- Incident response procedures
- Regular backup and disaster recovery

c) Physical Safeguards:
- Secure data centers with 24/7 monitoring
- Biometric access controls
- Environmental controls and fire protection

6. DATA RETENTION

a) Active Account Data:
- Personal information: Retained while account is active + 8 years (SEBI requirement)
- Trading records: 8 years from last transaction
- Communication records: 3 years

b) Inactive Accounts:
- Data anonymized after 2 years of inactivity
- Regulatory records retained as per law
- Right to request earlier deletion (subject to legal requirements)

7. YOUR RIGHTS

You have the right to:
- Access your personal information
- Correct inaccurate information
- Request deletion (subject to regulatory requirements)
- Object to processing for marketing purposes
- Withdraw consent where applicable
- Data portability for certain information

To exercise these rights, contact: {self.contact_details['email']}

8. COOKIES AND TRACKING

We use cookies for:
- Authentication and security
- Personalization of user experience  
- Analytics and performance monitoring
- Advertising and marketing (with consent)

You can control cookies through browser settings.

9. CHILDREN'S PRIVACY

Our services are not intended for users under 18 years of age. We do not knowingly collect information from minors.

10. INTERNATIONAL DATA TRANSFERS

Data is primarily stored in India. Any international transfers comply with applicable data protection laws and include appropriate safeguards.

11. CHANGES TO PRIVACY POLICY

We may update this policy to reflect:
- Changes in legal requirements
- New features or services
- Industry best practices

Users will be notified 30 days before material changes.

12. CONTACT INFORMATION

For privacy-related questions or concerns:

Email: {self.contact_details['email']}
Phone: {self.contact_details['phone']}
Address: {self.registered_address}

Data Protection Officer: dpo@sharewise.ai

13. REGULATORY COMPLIANCE

This policy complies with:
- SEBI (Investment Advisers) Regulations, 2013
- Information Technology Act, 2000
- Reserve Bank of India guidelines
- Other applicable Indian data protection laws
            """,
            'acceptance_required': True,
            'regulatory_basis': 'IT Act 2000, SEBI Regulations'
        }
    
    def get_risk_disclosure_document(self, investment_type: str = 'GENERAL') -> Dict[str, Any]:
        """Get comprehensive risk disclosure document"""
        
        risk_disclosures = {
            'GENERAL': {
                'title': 'General Risk Disclosure',
                'risks': [
                    'Market Risk: Securities prices can fluctuate significantly due to various factors',
                    'Liquidity Risk: Ability to buy/sell securities at desired prices may be limited',
                    'Credit Risk: Issuer may default on payments or obligations',
                    'Interest Rate Risk: Changes in interest rates affect security valuations',
                    'Inflation Risk: Rising inflation may erode real returns',
                    'Currency Risk: For foreign securities, exchange rate changes affect returns',
                    'Regulatory Risk: Changes in laws and regulations may impact investments',
                    'Operational Risk: System failures or errors may cause losses'
                ]
            },
            'EQUITY': {
                'title': 'Equity Investment Risk Disclosure',
                'risks': [
                    'Price Volatility: Stock prices can be highly volatile and unpredictable',
                    'Company-Specific Risk: Business performance directly affects stock value',
                    'Sector Risk: Industry-wide factors may negatively impact all sector stocks',
                    'Market Risk: Overall market conditions affect all equity investments',
                    'Dividend Risk: Companies may reduce or eliminate dividend payments',
                    'Dilution Risk: New share issuances may dilute existing shareholdings',
                    'Delisting Risk: Companies may be removed from stock exchanges'
                ]
            },
            'DERIVATIVES': {
                'title': 'Derivatives Trading Risk Disclosure',
                'risks': [
                    'LEVERAGE RISK: Small price movements can cause disproportionately large losses',
                    'TIME DECAY: Options lose value as expiration approaches (Theta decay)',
                    'VOLATILITY RISK: Changes in implied volatility significantly affect option prices',
                    'MARGIN RISK: Margin calls may require additional funds or force position closure',
                    'COUNTERPARTY RISK: Risk of counterparty default in OTC derivatives',
                    'LIQUIDITY RISK: May not find buyers/sellers at desired prices',
                    'COMPLEXITY RISK: Derivatives require sophisticated understanding of Greeks and pricing',
                    'UNLIMITED LOSS POTENTIAL: Some strategies can result in unlimited losses'
                ]
            },
            'COMMODITY': {
                'title': 'Commodity Trading Risk Disclosure',
                'risks': [
                    'Price Volatility: Commodity prices are influenced by supply-demand imbalances',
                    'Weather Risk: Agricultural commodities affected by weather conditions',
                    'Storage Risk: Physical commodities require storage and handling',
                    'Political Risk: Government policies and trade wars affect commodity prices',
                    'Currency Risk: International commodity prices typically in foreign currency',
                    'Seasonal Risk: Commodity prices follow seasonal patterns',
                    'Quality Risk: Physical delivery may involve quality variations'
                ]
            }
        }
        
        selected_disclosure = risk_disclosures.get(investment_type, risk_disclosures['GENERAL'])
        
        return {
            'title': selected_disclosure['title'],
            'investment_type': investment_type,
            'effective_date': '2024-01-01',
            'last_updated': timezone.now().date().isoformat(),
            'content': f"""
{selected_disclosure['title'].upper()}

IMPORTANT: Please read this risk disclosure carefully before making any investment decisions.

GENERAL INVESTMENT WARNINGS:

1. NO GUARANTEE OF RETURNS
   - Past performance does not guarantee future results
   - All investments carry risk of loss, including potential loss of principal
   - Market conditions can change rapidly and unpredictably

2. ARTIFICIAL INTELLIGENCE LIMITATIONS
   - AI recommendations are based on historical data and mathematical models
   - AI cannot predict black swan events or unprecedented market conditions
   - Models may have inherent biases or limitations in data sets
   - Technology failures may affect recommendation quality

3. REGULATORY WARNINGS
   - Investment advice is provided by SEBI-registered Investment Adviser
   - Client funds are not handled directly by the adviser
   - All investments subject to applicable securities laws and regulations

SPECIFIC RISKS FOR {investment_type} INVESTMENTS:

{chr(10).join([f"• {risk}" for risk in selected_disclosure['risks']])}

RISK MITIGATION RECOMMENDATIONS:

1. DIVERSIFICATION
   - Spread investments across different asset classes, sectors, and securities
   - Avoid concentration in any single investment
   - Consider correlation between different investments

2. POSITION SIZING
   - Never invest more than you can afford to lose
   - Limit individual positions to appropriate percentage of portfolio
   - Use stop-loss orders to limit downside risk

3. EDUCATION AND AWARENESS
   - Understand the investments before committing funds
   - Stay informed about market conditions and economic factors
   - Regularly review and rebalance portfolio

4. PROFESSIONAL GUIDANCE
   - Consult with qualified financial advisors
   - Consider your financial situation, goals, and risk tolerance
   - Seek independent advice for complex investment strategies

IMPORTANT DISCLAIMERS:

• This risk disclosure is not exhaustive and other risks may apply
• Market conditions can change rapidly, affecting risk profiles
• Investors should conduct their own due diligence
• Legal and tax implications should be considered separately
• Emergency fund should be maintained separate from investments

ACKNOWLEDGMENT REQUIRED:

By proceeding with investments, you acknowledge that:
- You have read and understood all risks mentioned above
- You are financially capable of bearing potential losses
- You will not rely solely on AI recommendations for investment decisions
- You understand the limitations of artificial intelligence systems
- You will seek professional advice when needed

For questions about risks, contact:
Email: {self.contact_details['email']}
Phone: {self.contact_details['phone']}

This document is prepared in accordance with SEBI guidelines and industry best practices.
            """,
            'acknowledgment_required': True,
            'sebi_compliance': True,
            'regulatory_basis': 'SEBI (Investment Advisers) Regulations, 2013'
        }
    
    def get_algorithm_disclosure(self) -> Dict[str, Any]:
        """Get AI/Algorithm specific disclosure"""
        return {
            'title': 'Artificial Intelligence and Algorithm Disclosure',
            'effective_date': '2024-01-01',
            'last_updated': timezone.now().date().isoformat(),
            'version': '1.0',
            'content': f"""
ARTIFICIAL INTELLIGENCE AND ALGORITHM DISCLOSURE

{self.company_name} uses artificial intelligence and machine learning algorithms to provide investment recommendations. This disclosure explains how our AI systems work and their limitations.

1. HOW OUR AI WORKS

a) Data Sources:
   - Historical price and volume data
   - Financial statements and company fundamentals
   - Economic indicators and market sentiment
   - News and social media sentiment analysis
   - Technical indicators and chart patterns

b) Machine Learning Models:
   - Deep learning neural networks (LSTM, CNN, Transformer)
   - Ensemble methods combining multiple algorithms
   - Natural language processing for news analysis
   - Reinforcement learning for strategy optimization
   - AutoML for hyperparameter optimization

c) Recommendation Generation:
   - Models analyze patterns in historical data
   - Probability scores assigned to different outcomes
   - Risk-adjusted returns calculated for each recommendation
   - Portfolio optimization considering correlation and diversification

2. AI SYSTEM LIMITATIONS

a) Data Limitations:
   - Historical data may not represent future market conditions
   - Data quality issues may affect model performance
   - Survivorship bias in historical datasets
   - Limited data for new or illiquid securities

b) Model Limitations:
   - Cannot predict unprecedented events (black swans)
   - May exhibit biases present in training data
   - Performance may degrade during regime changes
   - Overfitting to historical patterns is possible

c) Market Structure Changes:
   - New regulations may affect model effectiveness
   - Changes in market microstructure impact algorithms
   - High-frequency trading may alter price patterns
   - Central bank interventions may disrupt normal patterns

3. RISK FACTORS SPECIFIC TO AI RECOMMENDATIONS

a) Technology Risks:
   - System failures may interrupt service
   - Software bugs may cause incorrect recommendations
   - Cybersecurity threats to data and algorithms
   - Model drift due to changing market conditions

b) Performance Risks:
   - No guarantee that AI will outperform benchmarks
   - Models may underperform during certain market conditions
   - Backtesting results may not reflect real trading performance
   - Transaction costs may reduce theoretical returns

c) Behavioral Risks:
   - Over-reliance on AI may reduce critical thinking
   - False confidence in algorithmic recommendations
   - Failure to consider qualitative factors not captured by AI
   - Herd behavior if many users follow similar AI signals

4. TRANSPARENCY AND EXPLAINABILITY

a) Model Interpretability:
   - We provide feature importance scores for recommendations
   - Key factors driving each recommendation are explained
   - Confidence intervals provided for predictions
   - Regular model performance reports published

b) Limitations of Explainability:
   - Complex models may not be fully interpretable
   - Feature interactions may be difficult to explain
   - Some patterns detected by AI may not have obvious business logic
   - Explanations are simplified for user understanding

5. CONTINUOUS MONITORING AND IMPROVEMENT

a) Model Monitoring:
   - Real-time performance tracking
   - Drift detection and model retraining
   - A/B testing of different algorithms
   - Human oversight of AI recommendations

b) Model Updates:
   - Regular retraining with new data
   - Algorithm improvements and bug fixes
   - Incorporation of new data sources
   - Performance-based model selection

6. HUMAN OVERSIGHT

a) Expert Review:
   - Qualified analysts review AI recommendations
   - Unusual recommendations flagged for manual review
   - Market regime changes trigger additional scrutiny
   - Compliance team monitors for regulatory adherence

b) Client Responsibilities:
   - Understand your own investment objectives and constraints
   - Consider AI recommendations as one input among many
   - Maintain appropriate diversification and risk management
   - Seek professional advice for complex situations

7. REGULATORY COMPLIANCE

a) SEBI Guidelines:
   - AI recommendations comply with Investment Adviser regulations
   - Suitable only disclaimers provided where applicable
   - No guarantee of returns or assured performance claims
   - Conflicts of interest properly disclosed

b) Data Protection:
   - Personal data used only for recommendation generation
   - Privacy policies strictly followed
   - Data security measures implemented
   - Client consent obtained for data usage

8. CLIENT RIGHTS AND RESPONSIBILITIES

a) Your Rights:
   - Understand how recommendations are generated
   - Access to performance reports and statistics
   - Ability to customize risk parameters and preferences
   - Right to discontinue AI-based recommendations

b) Your Responsibilities:
   - Provide accurate information about financial situation
   - Understand limitations of AI systems
   - Make independent investment decisions
   - Monitor portfolio performance and rebalance as needed

IMPORTANT DISCLAIMERS:

• AI recommendations are not guarantees of future performance
• Past AI performance does not predict future results
• Market conditions may render AI models ineffective
• Professional human judgment remains important for investment decisions
• Technology failures may disrupt AI-based services

CONTACT INFORMATION:

For technical questions about our AI systems:
Email: {self.contact_details['email']}
Phone: {self.contact_details['phone']}

Chief Technology Officer: cto@sharewise.ai
AI Ethics Committee: ethics@sharewise.ai

This disclosure is provided in the interest of transparency and regulatory compliance.
            """,
            'acknowledgment_required': True,
            'technical_disclosure': True,
            'regulatory_basis': 'SEBI Guidelines and Industry Best Practices'
        }
    
    def generate_user_agreement_document(self, user_type: str = 'INDIVIDUAL') -> Dict[str, Any]:
        """Generate comprehensive user agreement"""
        
        current_date = timezone.now().date().isoformat()
        
        return {
            'title': f'User Agreement - {user_type}',
            'effective_date': current_date,
            'user_type': user_type,
            'version': '1.0',
            'content': f"""
USER AGREEMENT FOR SHAREWISE AI PLATFORM

User Type: {user_type}
Agreement Date: {current_date}
Version: 1.0

This User Agreement ("Agreement") is entered into between {self.company_name} ("Company", "we", "us") and the user ("Client", "you") for the provision of investment advisory services through the ShareWise AI platform.

SECTION 1: SERVICES PROVIDED

1.1 Investment Advisory Services:
- Algorithmic investment recommendations using artificial intelligence
- Portfolio analysis and risk assessment
- Market research and educational content
- Performance monitoring and reporting

1.2 Technology Platform:
- Web-based and mobile application access
- Real-time market data and analytics
- Automated recommendation generation
- Portfolio management tools

SECTION 2: CLIENT OBLIGATIONS

2.1 Information Accuracy:
- Provide complete and accurate personal and financial information
- Update information promptly when circumstances change
- Maintain current contact details and communication preferences

2.2 Compliance Requirements:
- Complete KYC verification as per SEBI requirements
- Comply with all applicable securities laws and regulations
- Report any compliance violations or concerns immediately

2.3 Account Security:
- Maintain confidentiality of login credentials
- Use secure networks for accessing the platform
- Report unauthorized access or suspicious activities

SECTION 3: FEES AND CHARGES

3.1 Advisory Fees:
- Fees clearly disclosed in fee schedule
- Billing frequency and payment terms specified
- No hidden charges or undisclosed commissions

3.2 Third Party Costs:
- Brokerage and transaction costs borne by client
- Taxes applicable as per prevailing rates
- Bank charges for fund transfers

SECTION 4: INVESTMENT PROCESS

4.1 Recommendation Generation:
- AI algorithms analyze market data and generate recommendations
- Risk profiling and suitability assessment conducted
- Recommendations provided with risk ratings and explanations

4.2 Investment Decisions:
- Final investment decisions rest solely with the client
- Company does not have discretionary authority over client funds
- Client may choose to accept, modify, or reject recommendations

SECTION 5: RISK ACKNOWLEDGMENTS

5.1 Market Risks:
- All investments subject to market risks and potential losses
- Past performance does not guarantee future results
- AI recommendations based on historical data and may not predict future outcomes

5.2 Technology Risks:
- System availability may be affected by technical issues
- Data transmission errors may occur
- AI models may have limitations and biases

SECTION 6: LIABILITY AND INDEMNIFICATION

6.1 Limitation of Liability:
- Company liability limited to fees paid by client in preceding 12 months
- Not liable for losses due to market risks or client investment decisions
- Force majeure events may suspend services without liability

6.2 Client Indemnification:
- Client indemnifies Company against losses due to client's breach of agreement
- Client responsible for compliance with applicable laws and regulations

SECTION 7: CONFIDENTIALITY AND DATA PROTECTION

7.1 Confidential Information:
- Company maintains confidentiality of client information
- Information shared only as required by law or regulation
- Data security measures implemented to protect client information

7.2 Data Usage:
- Client data used only for service provision and regulatory compliance
- Anonymized data may be used for research and model improvement
- Third-party data sharing limited to service providers and regulators

SECTION 8: TERMINATION

8.1 Termination Rights:
- Either party may terminate with 30 days written notice
- Company may terminate immediately for regulatory non-compliance
- Outstanding fees due upon termination

8.2 Post-Termination:
- Access to platform suspended upon termination
- Data retained as per regulatory requirements
- Confidentiality obligations survive termination

SECTION 9: DISPUTE RESOLUTION

9.1 Grievance Process:
- Internal grievance mechanism available
- Response within 7 working days for most complaints
- Escalation to SEBI SCORES for unresolved issues

9.2 Arbitration:
- Disputes resolved through arbitration in [City], India
- Arbitration conducted under Indian Arbitration and Conciliation Act, 2015
- Arbitrator's decision binding on both parties

SECTION 10: REGULATORY COMPLIANCE

10.1 SEBI Registration:
- Company registered as Investment Adviser (Registration: {self.sebi_registration})
- Services provided in accordance with SEBI regulations
- Regular regulatory filings and compliance monitoring

10.2 Code of Conduct:
- Company follows SEBI Code of Conduct for Investment Advisers
- Conflicts of interest properly identified and managed
- Client interests prioritized in all recommendations

SECTION 11: MISCELLANEOUS

11.1 Amendments:
- Agreement may be modified to reflect regulatory changes
- Material changes notified 30 days in advance
- Continued use constitutes acceptance of modifications

11.2 Governing Law:
- Agreement governed by Indian law and SEBI regulations
- Courts of [City] have exclusive jurisdiction

11.3 Severability:
- Invalid provisions do not affect validity of remaining agreement
- Reasonable efforts made to replace invalid provisions

SECTION 12: ACKNOWLEDGMENTS

By signing this agreement, the client acknowledges:
- Reading and understanding all terms and conditions
- Receiving copies of all risk disclosures and regulatory documents
- Understanding the nature and risks of investment advisory services
- Consent to processing of personal data for service provision

CLIENT SIGNATURE: _________________________    DATE: ___________

COMPANY REPRESENTATIVE: __________________    DATE: ___________

For questions about this agreement:
Email: {self.contact_details['email']}
Phone: {self.contact_details['phone']}
Address: {self.registered_address}

This agreement is effective from the date of execution and supersedes all previous agreements.
            """,
            'signature_required': True,
            'legal_document': True,
            'regulatory_basis': 'SEBI (Investment Advisers) Regulations, 2013'
        }
    
    def get_regulatory_notices(self) -> List[Dict[str, Any]]:
        """Get current regulatory notices and updates"""
        return [
            {
                'title': 'SEBI Circular on AI-based Investment Advice',
                'date': '2024-01-15',
                'reference': 'SEBI/HO/IMD/DF2/CIR/P/2024/001',
                'summary': 'Guidelines for use of artificial intelligence in investment advisory services',
                'impact': 'Enhanced disclosure requirements for AI-based recommendations',
                'action_required': 'Updated risk disclosures and algorithm transparency measures implemented',
                'compliance_status': 'COMPLIANT'
            },
            {
                'title': 'Updates to KYC Requirements',
                'date': '2024-02-01',
                'reference': 'SEBI/HO/MIRSD/MIRSD_RTAMB/P/CIR/2024/005',
                'summary': 'Enhanced KYC verification process for digital platforms',
                'impact': 'Additional verification steps for online KYC',
                'action_required': 'KYC process updated to include video verification',
                'compliance_status': 'IMPLEMENTED'
            },
            {
                'title': 'Risk Management Guidelines',
                'date': '2024-03-10',
                'reference': 'SEBI/HO/IMD/DF2/CIR/P/2024/015',
                'summary': 'Updated risk management framework for investment advisers',
                'impact': 'Enhanced position limits and circuit breaker requirements',
                'action_required': 'Risk management system upgraded with new parameters',
                'compliance_status': 'COMPLIANT'
            }
        ]


def get_all_legal_documents() -> Dict[str, Any]:
    """Get all legal documents and disclaimers"""
    disclaimer_manager = LegalDisclaimerManager()
    
    return {
        'investment_adviser_disclosure': disclaimer_manager.get_investment_adviser_disclosure(),
        'terms_of_service': disclaimer_manager.get_terms_of_service(),
        'privacy_policy': disclaimer_manager.get_privacy_policy(),
        'general_risk_disclosure': disclaimer_manager.get_risk_disclosure_document('GENERAL'),
        'equity_risk_disclosure': disclaimer_manager.get_risk_disclosure_document('EQUITY'),
        'derivatives_risk_disclosure': disclaimer_manager.get_risk_disclosure_document('DERIVATIVES'),
        'commodity_risk_disclosure': disclaimer_manager.get_risk_disclosure_document('COMMODITY'),
        'ai_algorithm_disclosure': disclaimer_manager.get_algorithm_disclosure(),
        'user_agreement': disclaimer_manager.generate_user_agreement_document('INDIVIDUAL'),
        'regulatory_notices': disclaimer_manager.get_regulatory_notices(),
        'generated_at': timezone.now().isoformat(),
        'version': '1.0'
    }