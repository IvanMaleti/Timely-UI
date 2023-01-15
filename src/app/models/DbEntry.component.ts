// This is a "struct" of a database entry
// All of the fields are strings because it's easier to communicate with backend that way
// startTime and EndTime are used for display of the time in table
// startTimeDateMilisec and endTimeDateMilisec are used to calculate duration of the project when the project is edited
export interface DbEntry
{
    id: string
    name: string;
    startTime: string;
    endTime: string;
    duration: string;
    startTimeDateMilisec: string;
    endTimeDateMilisec: string;
}
