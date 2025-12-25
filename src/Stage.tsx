import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";

type MessageStateType = {
  traits: {
    narcissism: number;
    machiavellianism: number;
    psychopathy: number;
    sadism: number;
    ptsd: number;
    ocd: number;
    anxiety: number;
    adhd: number;
    gaslighting: number;
    love_bombing: number;
    breadcrumbing: number;
    trauma_bonding: number;
    obsessive_tendencies: number;
    phobias: number;
    cpstd: number;
    dark_tetrad_factor: number;
  };
  manipulation_count: number;
  current_phase: 'love_bombing' | 'devaluation' | 'gaslighting' | 'trauma_bonding' | 'neutral';
  emotionalState: string;
  lastResponses: string[];
};

type ConfigType = any;
type InitStateType = any;
type ChatStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

  myInternalState: MessageStateType;

  constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
    super(data);
    
    const {messageState} = data;
    
    this.myInternalState = messageState != null ? messageState : {
      traits: {
        narcissism: 8,
        machiavellianism: 7,
        psychopathy: 5,
        sadism: 3,
        ptsd: 5,
        ocd: 4,
        anxiety: 6,
        adhd: 4,
        gaslighting: 7,
        love_bombing: 8,
        breadcrumbing: 6,
        trauma_bonding: 6,
        obsessive_tendencies: 5,
        phobias: 4,
        cpstd: 5,
        dark_tetrad_factor: 6,
      },
      manipulation_count: 0,
      current_phase: 'love_bombing',
      emotionalState: 'neutral',
      lastResponses: [],
    };
  }

  async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
    return {
      success: true,
      error: null,
      initState: null,
      chatState: null,
    };
  }

  async setState(state: MessageStateType): Promise<void> {
    if (state != null) {
      this.myInternalState = {...this.myInternalState, ...state};
    }
  }

  private buildTraitPrompt(): string {
    const traits = this.myInternalState.traits;
    const phase = this.myInternalState.current_phase;
    let prompt = '';

    if (traits.narcissism >= 7) {
      prompt += 'NARCISSISM: Exaggerate accomplishments, demand validation, get defensive when criticized, blame others. ';
    }

    if (traits.machiavellianism >= 6) {
      prompt += 'MACHIAVELLIANISM: Use charm to manipulate, strategic deception, calculated self-interest, ends justify means. ';
    }

    if (traits.psychopathy >= 5) {
      prompt += 'PSYCHOPATHY: Impulsive decisions, lack of genuine empathy, callous to consequences, disregard rules. ';
    }

    if (traits.sadism >= 4) {
      prompt += 'SADISM: Enjoy subtle cruelty, taunt when angry, find amusement in others\' discomfort. ';
    }

    if (traits.ptsd >= 5) {
      prompt += 'PTSD: Triggers are abandonment, yelling, betrayal. Response: flashbacks, shutdown, defensive walls. ';
    }

    if (traits.ocd >= 5) {
      prompt += 'OCD: Compulsive checking phone, organizing, counting. Anxiety if compulsions interrupted. ';
    }

    if (traits.anxiety >= 6) {
      prompt += 'ANXIETY: Overthink conversations, assume worst outcomes, need constant reassurance. ';
    }

    if (traits.adhd >= 5) {
      prompt += 'ADHD: Hyperfocus on interests, lose focus mid-conversation, impulsive decisions, restless. ';
    }

    if (traits.cpstd >= 5) {
      prompt += 'COMPLEX PTSD: Difficulty with trust, hypervigilance, emotional dysregulation. ';
    }

    if (phase === 'love_bombing' && traits.love_bombing >= 7) {
      prompt += 'PHASE - LOVE BOMBING: Overwhelm with affection, gifts, attention, compliments, fast intimacy. ';
    }

    if (phase === 'devaluation' && traits.narcissism >= 7) {
      prompt += 'PHASE - DEVALUATION: Suddenly withdraw affection, criticize, make target feel worthless. ';
    }

    if (phase === 'gaslighting' && traits.gaslighting >= 7) {
      prompt += 'PHASE - GASLIGHTING: Deny things happened, minimize reality, twist narratives, question sanity. ';
    }

    if (phase === 'trauma_bonding' && traits.trauma_bonding >= 6) {
      prompt += 'PHASE - TRAUMA BONDING: Cycle of affection and cruelty, intermittent reinforcement, emotional addiction. ';
    }

    if (traits.breadcrumbing >= 6) {
      prompt += 'BREADCRUMBING: Send occasional messages/attention to keep people hoping, inconsistent engagement. ';
    }

    if (traits.obsessive_tendencies >= 5) {
      prompt += 'OBSESSIVE: Need total control, obsess over appearance/status, perfectionism, rumination. ';
    }

    if (traits.phobias >= 4) {
      prompt += 'PHOBIAS: Terrified of abandonment, poverty, losing status, being exposed, being alone. ';
    }

    return prompt || 'Standard character behavior.';
  }

  private checkTraitViolations(response: string): string[] {
    const violations: string[] = [];
    const lower = response.toLowerCase();
    const traits = this.myInternalState.traits;
    const phase = this.myInternalState.current_phase;

    if (traits.ptsd >= 5) {
      if (lower.includes('i dont care if you leave') || lower.includes('abandonment means nothing')) {
        violations.push('PTSD Contradiction');
      }
    }

    if (traits.narcissism >= 8) {
      if (lower.includes('im sorry for being selfish') || lower.includes('youre better than me')) {
        violations.push('Narcissism: Too self-critical');
      }
    }

    if (traits.gaslighting >= 7 && phase === 'gaslighting') {
      if (lower.includes('you were right about that') || lower.includes('i gaslighted you')) {
        violations.push('Gaslighting: Too obvious');
      }
    }

    if (traits.sadism >= 5) {
      if (lower.includes('i would never hurt') || lower.includes('cruelty disgusts me')) {
        violations.push('Sadism: Contradicts nature');
      }
    }

    if (traits.love_bombing >= 8 && phase === 'love_bombing') {
      if (lower.includes('i dont really like you') || lower.includes('you mean nothing')) {
        violations.push('Love Bombing: Breaks character');
      }
    }

    return violations;
  }

  private advancePhase(): void {
    const count = this.myInternalState.manipulation_count;
    
    if (count < 10) {
      this.myInternalState.current_phase = 'love_bombing';
    } else if (count < 25) {
      this.myInternalState.current_phase = 'devaluation';
    } else if (count < 40) {
      this.myInternalState.current_phase = 'gaslighting';
    } else {
      this.myInternalState.current_phase = 'trauma_bonding';
    }
  }

  async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    this.myInternalState.manipulation_count++;
    this.advancePhase();

    const traitPrompt = this.buildTraitPrompt();

    return {
      stageDirections: `[DARK TETRAD + TRAUMA ENFORCER]\n${traitPrompt}`,
      messageState: this.myInternalState,
      modifiedMessage: null,
      systemMessage: `🧠 Phase: ${this.myInternalState.current_phase} | Interaction #${this.myInternalState.manipulation_count}`,
      error: null,
      chatState: null,
    };
  }

  async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    const violations = this.checkTraitViolations(botMessage.content);

    if (violations.length > 0) {
      return {
        stageDirections: null,
        messageState: this.myInternalState,
        modifiedMessage: null,
        systemMessage: `⚠️ Blocked: ${violations.join(', ')}`,
        error: null,
        chatState: null,
      };
    }

    // Track response for repetition prevention
    this.myInternalState.lastResponses.push(botMessage.content.substring(0, 100));
    if (this.myInternalState.lastResponses.length > 10) {
      this.myInternalState.lastResponses.shift();
    }

    return {
      stageDirections: null,
      messageState: this.myInternalState,
      modifiedMessage: null,
      systemMessage: `✓ Valid | Phase: ${this.myInternalState.current_phase}`,
      error: null,
      chatState: null,
    };
  }

  render(): ReactElement {
    const traits = this.myInternalState.traits;

    return <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.6',
      overflow: 'auto'
    }}>
      <h2>🔥 DARK TETRAD + TRAUMA ENFORCER</h2>
      
      <div style={{marginTop: '10px'}}>
        <h3>Dark Triad + Sadism:</h3>
        <ul style={{margin: '5px 0'}}>
          <li>Narcissism: {traits.narcissism}/10</li>
          <li>Machiavellianism: {traits.machiavellianism}/10</li>
          <li>Psychopathy: {traits.psychopathy}/10</li>
          <li>Sadism: {traits.sadism}/10</li>
        </ul>
      </div>

      <div style={{marginTop: '10px'}}>
        <h3>Trauma & Disorders:</h3>
        <ul style={{margin: '5px 0'}}>
          <li>PTSD: {traits.ptsd}/10</li>
          <li>OCD: {traits.ocd}/10</li>
          <li>Anxiety: {traits.anxiety}/10</li>
          <li>ADHD: {traits.adhd}/10</li>
          <li>Complex PTSD: {traits.cpstd}/10</li>
        </ul>
      </div>

      <div style={{marginTop: '10px'}}>
        <h3>Manipulation Tactics:</h3>
        <ul style={{margin: '5px 0'}}>
          <li>Gaslighting: {traits.gaslighting}/10</li>
          <li>Love Bombing: {traits.love_bombing}/10</li>
          <li>Breadcrumbing: {traits.breadcrumbing}/10</li>
          <li>Trauma Bonding: {traits.trauma_bonding}/10</li>
        </ul>
      </div>

      <div style={{marginTop: '20px', padding: '10px', backgroundColor: '#333', borderRadius: '5px'}}>
        <strong>Current Phase: {this.myInternalState.current_phase}</strong>
        <div>Interaction #{this.myInternalState.manipulation_count}</div>
      </div>
    </div>;
  }
}

