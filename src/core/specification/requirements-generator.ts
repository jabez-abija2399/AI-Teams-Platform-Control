import { FunctionalRequirement, UserStory, DatabaseRequirement, ApiRequirement } from './types';

export class RequirementsGenerator {
  public static generateFunctionalRequirements(features: string[]): FunctionalRequirement[] {
    return features.map((feature, idx) => ({
      id: `FR-${idx + 1}`,
      title: feature,
      description: `System must provide robust capabilities for ${feature.toLowerCase()}.`,
      priority: idx === 0 ? 'CRITICAL' : idx < 3 ? 'HIGH' : 'MEDIUM',
      category: 'Core Features',
    }));
  }

  public static generateUserStories(features: string[]): UserStory[] {
    return features.map((feature, idx) => ({
      id: `US-${idx + 1}`,
      asA: 'Registered User',
      iWantTo: `access and utilize ${feature}`,
      soThat: 'I can achieve my workflow tasks efficiently',
      acceptanceCriteria: [
        'User interface is responsive and fully accessible',
        'Input forms validate data using Zod schema constraints',
        'State transitions emit real-time visual feedback',
      ],
    }));
  }

  public static generateDatabaseSchema(): DatabaseRequirement[] {
    return [
      {
        tableName: 'users',
        fields: [
          { name: 'id', type: 'String (CUID)', isRequired: true },
          { name: 'email', type: 'String (Unique)', isRequired: true },
          { name: 'name', type: 'String', isRequired: false },
          { name: 'role', type: 'String', isRequired: true },
        ],
        relationships: ['hasMany Projects', 'hasMany Sessions'],
      },
      {
        tableName: 'projects',
        fields: [
          { name: 'id', type: 'String (CUID)', isRequired: true },
          { name: 'title', type: 'String', isRequired: true },
          { name: 'status', type: 'String', isRequired: true },
        ],
        relationships: ['belongsTo User', 'hasMany Executions'],
      },
    ];
  }

  public static generateApiEndpoints(): ApiRequirement[] {
    return [
      {
        endpoint: '/api/projects',
        method: 'GET',
        description: 'Fetch list of all active user projects',
        responsePayload: '{ success: true, data: Project[] }',
      },
      {
        endpoint: '/api/projects',
        method: 'POST',
        description: 'Create a new project from user prompt',
        requestPayload: '{ title: string, prompt: string }',
        responsePayload: '{ success: true, projectId: string }',
      },
    ];
  }
}
