import { Inject, Injectable } from "@nestjs/common";
import { LLMResponse } from "../types/llm-response";
import { LLMQueryParams } from "../types/llm-query-params";
import { LLMServiceBase } from "../abstract/llm.service.base";

export const LLM_REGISTRY = "LLM_REGISTRY";

export enum LLMModelTypes {
  SOON = "soon",
  IMMEDIATE = "immediate",
}

export enum ProviderClientType {
  OPENAI = "openai",
  GEMINI = "gemini",
  OLLAMA = "ollama",
}

export const MODEL_MAP = {
  [LLMModelTypes.SOON]: {
    provider: "gemini",
    envKey: "gemini",
    model: "gemini-2.5-flash",
  },
  [LLMModelTypes.IMMEDIATE]: {
    provider: "open-ai",
    envKey: "nvidia",
    model: "z-ai/glm4.7",
  },
};

@Injectable()
export class LLMProviderService {
  constructor(
    @Inject(LLM_REGISTRY)
    private readonly providers: Map<LLMModelTypes, LLMServiceBase>,
  ) {}

  async query(
    params: LLMQueryParams,
    modelType: LLMModelTypes,
  ): Promise<LLMResponse> {
    const provider = this.providers.get(modelType);
    if (!provider) {
      throw new Error(`Provider not found for model: ${modelType}`);
    }
    return provider.query(params);
  }
}
