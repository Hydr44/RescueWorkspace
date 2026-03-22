import dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { backendAgent, backendTasks } from './agents/backend-agent.js';
import { desktopAgent, desktopTasks } from './agents/desktop-agent.js';
import { webAgent, webTasks } from './agents/web-agent.js';
import { mobileAgent, mobileTasks } from './agents/mobile-agent.js';
import { qaAgent, qaTasks } from './agents/qa-agent.js';
import { broadcastStatus } from './dashboard/websocket.js';
import { createAgentTools } from './tools/agent-tools.js';

dotenv.config();

export class RescueManagerCrew {
  constructor() {
    this.agents = {
      backend: backendAgent,
      desktop: desktopAgent,
      web: webAgent,
      mobile: mobileAgent,
      qa: qaAgent
    };
    
    this.tasks = {
      backend: backendTasks,
      desktop: desktopTasks,
      web: webTasks,
      mobile: mobileTasks,
      qa: qaTasks
    };
    
    this.activeTasks = new Map();
    this.completedTasks = [];
    this.errors = [];
  }

  async assignTask(agentName, taskName, customDescription = null) {
    const agent = this.agents[agentName];
    const taskTemplate = this.tasks[agentName][taskName];
    
    if (!agent || !taskTemplate) {
      throw new Error(`Agent ${agentName} or task ${taskName} not found`);
    }

    const task = {
      ...taskTemplate,
      description: customDescription || taskTemplate.description,
      id: `${agentName}-${taskName}-${Date.now()}`,
      startTime: new Date(),
      status: 'running'
    };

    this.activeTasks.set(task.id, task);
    
    console.log(chalk.blue(`\n🚀 Assigning task to ${chalk.bold(agent.role)}`));
    console.log(chalk.gray(`   Task: ${task.description}`));
    
    broadcastStatus({
      type: 'task_started',
      agent: agentName,
      task: task.id,
      description: task.description,
      timestamp: task.startTime
    });

    const spinner = ora(`${agent.role} is working...`).start();

    try {
      // Crea directory reports se non esiste
      const fs = await import('fs/promises');
      const reportDir = `${process.env.WORKSPACE_ROOT}/ai-team/reports`;
      await fs.mkdir(reportDir, { recursive: true });
      
      // Crea tools per l'agente
      const tools = createAgentTools();
      
      // Crea prompt template con tools renderizzati
      const toolDescriptions = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
      const toolNames = tools.map(t => t.name).join(', ');
      
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', `${agent.backstory}

Role: ${agent.role}
Goal: ${agent.goal}

You are working on the RescueManager project located at: ${process.env.WORKSPACE_ROOT}

IMPORTANT RULES:
- You CAN modify files and run commands autonomously
- You CANNOT modify files in RENTRI, SDI, or RVFU modules (protected)
- Always use absolute paths starting with ${process.env.WORKSPACE_ROOT}
- Test your changes after making them
- Provide a summary of what you did

Available tools:
${toolDescriptions}

Tool names: ${toolNames}`],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}']
      ]);

      // Crea agente con tools
      const agentWithTools = await createToolCallingAgent({
        llm: agent.llm,
        tools,
        prompt
      });

      // Crea executor
      const executor = new AgentExecutor({
        agent: agentWithTools,
        tools,
        verbose: process.env.VERBOSE === 'true',
        maxIterations: parseInt(process.env.MAX_ITERATIONS) || 10
      });

      // Esegui task
      const response = await executor.invoke({
        input: task.description
      });
      
      const result = response.output;
      
      spinner.succeed(chalk.green(`${agent.role} completed task`));
      
      task.status = 'completed';
      task.endTime = new Date();
      task.result = result;
      task.duration = task.endTime - task.startTime;
      
      // Salva report dettagliato su file
      const reportPath = `${reportDir}/${task.id}.json`;
      const detailedReport = {
        taskId: task.id,
        agent: {
          name: agentName,
          role: agent.role,
          goal: agent.goal
        },
        task: {
          description: task.description,
          expectedOutput: task.expectedOutput
        },
        execution: {
          startTime: task.startTime.toISOString(),
          endTime: task.endTime.toISOString(),
          duration: `${(task.duration / 1000).toFixed(2)}s`
        },
        result: {
          output: result,
          steps: response.intermediateSteps || [],
          fullResponse: response
        }
      };
      
      await fs.writeFile(reportPath, JSON.stringify(detailedReport, null, 2));
      console.log(chalk.gray(`📄 Report salvato: ${reportPath}`));
      
      this.activeTasks.delete(task.id);
      this.completedTasks.push(task);
      
      console.log(chalk.green(`✅ Result: ${result.substring(0, 200)}...`));
      console.log(chalk.cyan(`📖 Report completo: ai-team/reports/${task.id}.json`));
      
      broadcastStatus({
        type: 'task_completed',
        agent: agentName,
        task: task.id,
        result: result,
        duration: task.duration,
        timestamp: task.endTime,
        reportPath: reportPath
      });
      
      return result;
      
    } catch (error) {
      spinner.fail(chalk.red(`${agent.role} failed`));
      
      task.status = 'failed';
      task.endTime = new Date();
      task.error = error.message;
      
      this.activeTasks.delete(task.id);
      this.errors.push(task);
      
      console.error(chalk.red(`❌ Error: ${error.message}`));
      
      broadcastStatus({
        type: 'task_failed',
        agent: agentName,
        task: task.id,
        error: error.message,
        timestamp: task.endTime
      });
      
      throw error;
    }
  }

  async runParallel(tasks) {
    console.log(chalk.yellow(`\n⚡ Running ${tasks.length} tasks in parallel...\n`));
    
    const promises = tasks.map(({ agent, task, description }) => 
      this.assignTask(agent, task, description)
    );
    
    return Promise.allSettled(promises);
  }

  getStatus() {
    return {
      active: Array.from(this.activeTasks.values()),
      completed: this.completedTasks,
      errors: this.errors,
      agents: Object.keys(this.agents).map(name => ({
        name,
        role: this.agents[name].role,
        status: this.activeTasks.has(name) ? 'busy' : 'idle'
      }))
    };
  }

  printSummary() {
    console.log(chalk.cyan('\n📊 Team Summary\n'));
    console.log(chalk.white(`Active tasks: ${chalk.bold(this.activeTasks.size)}`));
    console.log(chalk.green(`Completed: ${chalk.bold(this.completedTasks.length)}`));
    console.log(chalk.red(`Errors: ${chalk.bold(this.errors.length)}`));
    
    if (this.completedTasks.length > 0) {
      const avgDuration = this.completedTasks.reduce((sum, t) => sum + t.duration, 0) / this.completedTasks.length;
      console.log(chalk.gray(`Average duration: ${Math.round(avgDuration / 1000)}s`));
    }
  }
}

// Export singleton instance
export const crew = new RescueManagerCrew();

// CLI usage example
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(chalk.bold.cyan('\n🤖 RescueManager AI Team\n'));
  
  // Example: Run multiple tasks in parallel
  await crew.runParallel([
    { agent: 'backend', task: 'testIntegrations', description: 'Test SDI, RENTRI, RVFU integrations' },
    { agent: 'desktop', task: 'fixBug', description: 'Fix RLS error in InvoiceNew.jsx' },
    { agent: 'qa', task: 'createTestSuite', description: 'Create E2E tests for invoice flow' }
  ]);
  
  crew.printSummary();
}
