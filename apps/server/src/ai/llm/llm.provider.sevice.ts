import { Inject, Injectable } from "@nestjs/common";
import { LLMModelType } from "@home-ai/shared/domain/llm/llm-model-type";
import { LLMResponse } from "../types/llm-response";
import { LLMQueryParams } from "../types/llm-query-params";
import { LLMServiceBase } from "../abstract/llm.service.base";

export const LLM_REGISTRY = "LLM_REGISTRY";

/** @deprecated Prefer LLMModelType from shared; kept as alias for existing call sites. */
export const LLMModelTypes = LLMModelType;
export type LLMModelTypes = LLMModelType;
export { LLMModelType };

export enum ProviderClientType {
  OPENAI = "openai",
  GEMINI = "gemini",
  OLLAMA = "ollama",
}

export const MODEL_MAP = {
  [LLMModelTypes.IMMEDIATE]: {
    provider: "gemini",
    envKey: "gemini",
    model: "gemini-2.5-flash",
  },
  [LLMModelTypes.SOON]: {
    provider: "open-ai",
    envKey: "nvidia",
    model: "nvidia/nemotron-3.5-lightning-30b-a3b",
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
