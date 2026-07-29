// src/tools/default/get-fact.tool.ts
import { ToolHandler } from "src/tools/abstract/tool-handler";
import { ToolContext } from "src/tools/types/tool-context";
import { z } from "zod";
import { FactsStore } from "../stores/facts.store";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";
import { ToolParameterUtils } from "src/tools/utils/tool-parameter-utils";

const GetFactToolSchema = z.object({
  key: z
    .preprocess(ToolParameterUtils.toStringValue, z.string().min(1))
    .describe(
      "Exact key from list-facts (facts registered in Home AI). Do not guess.",
    ),
});

export interface GetFactResult {
  key: string;
  value: string;
  message: string;
}

@Tool()
@Injectable()
export class GetFactTool extends ToolHandler<
  typeof GetFactToolSchema,
  GetFactResult
> {
  readonly name = "get-fact";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Retrieve a fact registered in Home AI by exact key. Call list-facts first unless the key is already known.";

  readonly parameters = GetFactToolSchema;

  constructor(private readonly factsStore: FactsStore) {
    super();
  }

  async execute(
    params: z.infer<typeof GetFactToolSchema>,
    context: ToolContext,
  ): Promise<GetFactResult> {
    const fact = await this.factsStore.getByKey(params.key, context.authUser);

    if (!fact) {
      return {
        key: params.key,
        value: "",
        message: `Fact with key "${params.key}" not found. Try calling list-facts first.`,
      };
    }

    return {
      key: fact.key,
      value: fact.value,
      message: `Fact "${fact.key}" retrieved.`,
    };
  }
}
