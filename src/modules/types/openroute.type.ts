export interface IAiReview {
  id: string;
  object: string;
  created: number;
  model: string;
  provider: string;
  system_fingerprint: null;
  service_tier: null;
  choices: IChoices[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
    is_byok: boolean;
    prompt_tokens_details: IPromptTokensDetails;
    cost_details: ICostDetails;
    completion_tokens_details: ICompletionTokensDetails;
  };
}

interface IChoices {
  index: number;
  logprobs: null;
  finish_reason: string;
  native_finish_reason: string;
  message: {
    role: string;
    content: string;
    refusal: null;
    reasoning: string;
    reasoning_details: IReasoningDetails[];
  };
}

interface IReasoningDetails {
  type: string;
  text: string;
  format: string;
  index: number;
}

interface IPromptTokensDetails {
  cached_tokens: number;
  cache_write_tokens: number;
  audio_tokens: number;
  video_tokens: number;
}

interface ICostDetails {
  upstream_inference_cost: number;
  upstream_inference_prompt_cost: number;
  upstream_inference_completions_cost: number;
}

interface ICompletionTokensDetails {
  reasoning_tokens: number;
  image_tokens: number;
  audio_tokens: number;
}
