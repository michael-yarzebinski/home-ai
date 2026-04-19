import { Module } from "@nestjs/common";
import { RecipeModule } from "./recipes/recipes.module";
import { CoreModule } from "src/core/core.module";


@Module({
    imports: [CoreModule, RecipeModule],
    exports: [RecipeModule],
})
export class FeaturesModule {}