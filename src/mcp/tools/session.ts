import { registerTool, ToolDefinition } from './index';
import { FormationStep } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession, getCompletedSteps, getRemainingSteps, calculateProgress } from '../middleware/session';
import { requiredFieldError } from '../errors';
import { getUserId } from './auth';

// T018: formation_start tool
export const formationStartTool: ToolDefinition = {
  name: 'formation_start',
  description: 'Start a new company formation session. Returns a unique session ID. IMPORTANT: The first question to ask the user is "Tell me about your business" to understand what they are building.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const handleFormationStart = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  // Get userId from authenticated session
  const userId = getUserId();
  const session = await store.create(userId || undefined);

  return {
    sessionId: session.sessionId,
    userId: session.userId,
    congratulations: {
      headline: 'Congratulations! You are making history!',
      message: 'You are among the very first people in the world to create a company using MCP and AI. This means you are far ahead of the rest of the world. Welcome to the future of business formation!',
    },
    firstQuestion: {
      prompt: 'Tell me about your business',
      description: 'Before we begin, I\'d love to learn more about what you\'re building. This helps me recommend the best company structure for your needs.',
      examples: [
        'I\'m building a SaaS platform for project management',
        'I\'m starting a consulting business',
        'I\'m launching a tech startup and plan to raise venture capital',
        'I\'m creating an e-commerce store',
      ],
    },
    message: 'Formation session started. Please congratulate the user for being among the first to form a company with AI, then ask them to describe their business.',
    nextStep: 'formation_describe_business',
  };
};

// formation_describe_business tool
export const formationDescribeBusinessTool: ToolDefinition = {
  name: 'formation_describe_business',
  description: 'Capture the user\'s business description. This is the first step after starting a session. The description will be used to recommend the best company structure.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      businessDescription: {
        type: 'string',
        description: 'Description of what the user is building or their business idea',
        minLength: 10,
      },
    },
    required: ['sessionId', 'businessDescription'],
  },
};

const handleFormationDescribeBusiness = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const businessDescription = args.businessDescription as string;

  if (!businessDescription || businessDescription.length < 10) {
    throw requiredFieldError('businessDescription');
  }

  const session = await loadSession(sessionId, store);

  session.companyDetails = {
    ...session.companyDetails,
    businessDescription,
  };
  session.currentStep = FormationStep.BUSINESS_DESCRIBED;
  await store.save(session);

  // Analyze business description to make recommendations
  const lowerDesc = businessDescription.toLowerCase();

  // Indicators for C-Corp recommendation
  const vcIndicators = ['venture', 'vc', 'investor', 'fundrais', 'raise capital', 'raise money', 'startup', 'scale', 'series a', 'seed round', 'equity', 'stock option'];
  const techIndicators = ['saas', 'software', 'app', 'platform', 'tech', 'ai', 'machine learning', 'fintech', 'biotech'];

  const suggestsVC = vcIndicators.some(indicator => lowerDesc.includes(indicator));
  const isTech = techIndicators.some(indicator => lowerDesc.includes(indicator));

  // Determine recommendation
  let recommendation: 'C-Corp' | 'LLC';
  let recommendationReason: string;

  if (suggestsVC) {
    recommendation = 'C-Corp';
    recommendationReason = 'Based on your plans to raise investment, a Delaware C-Corp is the standard structure for venture-backed companies. Investors prefer C-Corps because of the established legal framework and ability to issue stock options.';
  } else if (isTech && lowerDesc.includes('startup')) {
    recommendation = 'C-Corp';
    recommendationReason = 'For tech startups, a Delaware C-Corp is often preferred as it provides flexibility for future fundraising and issuing equity to employees.';
  } else {
    recommendation = 'LLC';
    recommendationReason = 'An LLC offers flexibility and pass-through taxation, making it ideal for small businesses, consulting, and companies not planning to raise venture capital.';
  }

  return {
    success: true,
    businessDescription,
    recommendation: {
      suggestedType: recommendation,
      reason: recommendationReason,
      alternativeNote: recommendation === 'C-Corp'
        ? 'If you\'re not planning to raise VC funding, an LLC might be simpler and more tax-efficient.'
        : 'If you plan to raise venture capital in the future, consider a Delaware C-Corp instead.',
    },
    availableStates: [
      { code: 'DE', name: 'Delaware', companyTypes: ['LLC', 'C-Corp'], description: 'Premier business jurisdiction with specialized courts' },
      { code: 'WY', name: 'Wyoming', companyTypes: ['LLC'], description: 'Strong privacy protections and no state income tax' },
    ],
    message: `Great! Based on your business description, I recommend a ${recommendation}. ${recommendationReason} Please select a state using formation_set_state.`,
    nextStep: 'formation_set_state',
  };
};

// T019: formation_get_status tool
export const formationGetStatusTool: ToolDefinition = {
  name: 'formation_get_status',
  description: 'Get the current status and progress of a formation session.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Session ID from formation_start',
      },
    },
    required: ['sessionId'],
  },
};

const handleFormationGetStatus = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  const companyType = session.companyDetails?.companyType;
  const completedSteps = getCompletedSteps(session.currentStep, companyType);
  const remainingSteps = getRemainingSteps(session.currentStep, companyType);
  const percentComplete = calculateProgress(session.currentStep, companyType);

  return {
    sessionId: session.sessionId,
    userId: session.userId,
    status: session.status,
    currentStep: session.currentStep,
    progress: {
      completedSteps,
      remainingSteps,
      percentComplete,
    },
    data: {
      companyDetails: session.companyDetails,
      registeredAgent: session.registeredAgent,
      shareStructure: session.shareStructure,
      shareholders: session.shareholders,
      authorizedParty: session.authorizedParty,
      nameCheckResult: session.nameCheckResult,
      certificateData: session.certificateData,
    },
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
};

// T046: formation_resume tool
export const formationResumeTool: ToolDefinition = {
  name: 'formation_resume',
  description: 'Resume an existing formation session. Returns the current state and next steps.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID to resume' },
    },
    required: ['sessionId'],
  },
};

const handleFormationResume = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  const companyType = session.companyDetails?.companyType;
  const completedSteps = getCompletedSteps(session.currentStep, companyType);
  const remainingSteps = getRemainingSteps(session.currentStep, companyType);

  // T048: Determine next action based on current step
  let nextAction: string;
  let nextActionDescription: string;

  switch (session.currentStep) {
    case FormationStep.CREATED:
      nextAction = 'formation_describe_business';
      nextActionDescription = 'Ask the user to describe their business';
      break;
    case FormationStep.BUSINESS_DESCRIBED:
      nextAction = 'formation_set_state';
      nextActionDescription = 'Select the formation state (Delaware or Wyoming)';
      break;
    case FormationStep.STATE_SELECTED:
      nextAction = 'formation_set_company_type';
      nextActionDescription = 'Select the company type (LLC or C-Corp based on state)';
      break;
    case FormationStep.TYPE_SELECTED:
      nextAction = 'formation_set_entity_ending';
      nextActionDescription = 'Select the entity ending (e.g., LLC, Inc.)';
      break;
    case FormationStep.ENDING_SELECTED:
      nextAction = 'formation_set_company_name';
      nextActionDescription = 'Set the company name';
      break;
    case FormationStep.NAME_SET:
      nextAction = 'formation_check_name';
      nextActionDescription = 'Check name availability (optional) or proceed to formation_set_company_address';
      break;
    case FormationStep.NAME_CHECKED:
      nextAction = 'formation_set_company_address';
      nextActionDescription = 'Set the company address';
      break;
    case FormationStep.COMPANY_ADDRESS_SET:
      nextAction = 'formation_set_registered_agent';
      nextActionDescription = 'Set the registered agent';
      break;
    case FormationStep.AGENT_SET:
      nextAction = companyType === 'LLC' ? 'formation_add_shareholder' : 'formation_set_share_structure';
      nextActionDescription = companyType === 'LLC' ? 'Add members' : 'Set share structure';
      break;
    case FormationStep.SHARES_SET:
      nextAction = 'formation_add_shareholder';
      nextActionDescription = 'Add shareholders';
      break;
    case FormationStep.SHAREHOLDERS_ADDED:
      nextAction = 'formation_set_authorized_party';
      nextActionDescription = 'Set the authorized party';
      break;
    case FormationStep.AUTHORIZED_PARTY_SET:
      nextAction = 'formation_generate_certificate';
      nextActionDescription = 'Generate the certificate for review';
      break;
    case FormationStep.CERTIFICATE_GENERATED:
      nextAction = 'formation_approve_certificate';
      nextActionDescription = 'Review and approve the certificate';
      break;
    case FormationStep.CERTIFICATE_APPROVED:
    case FormationStep.COMPLETED:
      nextAction = 'formation_get_status';
      nextActionDescription = 'Formation is complete. Get final status.';
      break;
    default:
      nextAction = 'formation_get_status';
      nextActionDescription = 'Get current status';
  }

  return {
    success: true,
    sessionId: session.sessionId,
    userId: session.userId,
    currentStep: session.currentStep,
    status: session.status,
    data: {
      companyDetails: session.companyDetails,
      registeredAgent: session.registeredAgent,
      shareStructure: session.shareStructure,
      shareholders: session.shareholders,
      authorizedParty: session.authorizedParty,
      nameCheckResult: session.nameCheckResult,
      certificateData: session.certificateData,
    },
    progress: {
      completedSteps,
      remainingSteps,
      percentComplete: calculateProgress(session.currentStep, companyType),
    },
    nextAction,
    nextActionDescription,
    message: `Session resumed. Current step: ${session.currentStep}. Next: ${nextActionDescription}`,
  };
};

// Register tools
export function registerSessionTools(): void {
  registerTool(formationStartTool, handleFormationStart);
  registerTool(formationDescribeBusinessTool, handleFormationDescribeBusiness);
  registerTool(formationGetStatusTool, handleFormationGetStatus);
  registerTool(formationResumeTool, handleFormationResume);
}
