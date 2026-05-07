import { Module } from "@nestjs/common";
import { RecipeSaverModule } from "./recipe-saver/recipe-saver.module";
import { FactsModule } from "./facts/fact.module";
import { ChecklistModule } from "./checklist/checklist.module";
import { NoteModule } from "./note/note.module";
import { CalendarModule } from "./calendar/calendar.module";
import { WeatherModule } from "./weather/weather.module";

@Module({
  imports: [
    FactsModule,
    RecipeSaverModule,
    ChecklistModule,
    NoteModule,
    CalendarModule,
    WeatherModule,
  ],
})
export class FeaturesModule {}
