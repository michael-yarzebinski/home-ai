export enum TaskName {
    // Grocery / Checklist
    AddToGroceryList = 'addToGroceryList',
    AddToShortTermList = 'addToShortTermList',
    AddToLongTermList = 'addToLongTermList',
  
    // Calendar
    AddCalendarEvent = 'addCalendarEvent',
    ReadCalendar = 'readCalendar',
  
    // Memory / Facts
    StoreFact = 'storeFact',
    RetrieveFact = 'retrieveFact',
  
    // Summaries
    DailySummary = 'dailySummary',
    WeeklyRecap = 'weeklyRecap',
    ShowPendingApprovals = 'showPendingApprovals',
  
    // Device Management
    AddDevice = 'addDevice',
    QueryDevice = 'queryDevice',        // ← NEW

    SaveRecipe = 'saveRecipe',

    NotifyForDevice = 'notifyForDevice',
  
    // Add more here as you create new tasks
  }