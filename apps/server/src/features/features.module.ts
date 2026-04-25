import { Module } from "@nestjs/common";
import { RecipeSaverModule } from "./recipe-saver/recipe-saver.module";
import { FactsModule } from "./facts/fact.module";

@Module({
    imports: [
        FactsModule,
        RecipeSaverModule
    ],
})
export class FeaturesModule {}