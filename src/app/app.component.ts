import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DbEntry } from './models/DbEntry.component';
import { ProjentryService } from './services/projentry.service';
import * as XLSX from 'xlsx';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit 
{
  title = 'Timely.UI';

  // This are the references to HTML components which are being hidden and re-appear in the runtime
  @ViewChild('startBtn') _startButton!: ElementRef;
  @ViewChild('secondaryStartBtn') _secondaryStartButton!: ElementRef;
  @ViewChild('stopBtn') _stopButton!: ElementRef;
  @ViewChild('table') _table!: ElementRef;
  @ViewChild('modal') _modal!: ElementRef;
  @ViewChild('pagiHandler') _pagiHandler!: ElementRef;
  @ViewChild('pagiHandlerTable') _pagiHandlerTable!:ElementRef;
  @ViewChild('editEntryModal') _editEntryModal! :ElementRef;

  // _chronoEntries is an array of all database entries sorted by start time (starting with the oldest ones)
  _chronoEntries: DbEntry[] = [];

  // _displayEntries is an array of database entries which is currently being displayed on the screen 
  _displayEntries: DbEntry[] = [];

  // Since the table always displays 7 rows, next two fields are handling number of empty rows in the table
  _emptyRowsToFill: number = 0;
  _emptyList: Array<number> = new Array(10).fill(null);

  // Next two fields are handling startTime of database entry (when the Start button is clicked) and endTime of database entry (when the Stop button is clicked)
  _startTime: Date = new Date();
  _endTime: Date = new Date();

  // Inputs from HTML point to next two fields and the values of these fields are passed to the name field of database entry when the project is being added or edited  
  _addName:string='';
  _editName:string='';

  // Date inputs from HTML point to next two fields and the values of these fields are passed to the startTimeDateMilisec and endTimeDateMilisec fields of database entry when the project is being edited
  // Their value is later on used to calculate duration 
  _editStartTime:Date = new Date();
  _editEndTime:Date = new Date();

  // _currentPage is showing the users choice of page
  // It can never be greater than _maxPage
  _currentPage:number = 1;

  // Maximal possible page of the main table - e.g. Database has 13 entries and the _maxPage is 2
  _maxPage:number = 1;
  
  // This boolean becomes true if the user leaves the page not stoping the timer 
  _pendingFromLastTime: boolean = false;

  // Name of the excel file which is going to be created with the click on Export to Excel button
  _fileName= 'ExcelSheet.xlsx';

  // Last entry to the database - It is set every time when the Start button is clicked
  _lastDbEntry : DbEntry = 
  {
    id : '',
    name : '',
    startTime: '',
    endTime: '',
    duration: '',  
    startTimeDateMilisec: '',
    endTimeDateMilisec: ''       
  };

  // This field is passed to HttpPost request when the Start button is clicked
  _addDbEntry: DbEntry =
  {
    id : '00000000-0000-0000-0000-000000000000',
    name : '',
    startTime: '',
    endTime: '',
    duration: '',
    startTimeDateMilisec: '',
    endTimeDateMilisec: ''     
  };

  // This field is passed to HttpPut request when the project is edited (name, start time and end time)
  _editDbEntry: DbEntry =
  {
    id : '',
    name : '',
    startTime: '',
    endTime: '',
    duration: '',    
    startTimeDateMilisec: '',
    endTimeDateMilisec: ''    
  };
  



  constructor(private projEntryService : ProjentryService){}
  
  //Automatically called when the page is opened/refreshed
  ngOnInit(): void 
  {
    this.InitialSetup();
  }
  
  // Initial setup gets all entries from database and displays them
  // It also checks if the user left the page not stoping the timer - in that case Stop button is displayed instead of default start button
  /* Note async keyword - this enables wait() mathod to be called. It is implemented to make sure Http requests are completed before 
     using the values from database  */
  async InitialSetup() 
  {
    this.GetAllEntries(); 
    await this.wait(30);
    for (let index = 0; index < this._chronoEntries.length; index++) {
      const element = this._chronoEntries[index];
      if (element.endTime == '...') 
      {
        this._lastDbEntry = element;
        this._startButton.nativeElement.style.display="none";
        this._stopButton.nativeElement.style.display="block";
        this._table.nativeElement.style.display="block";
        this._pagiHandlerTable.nativeElement.style.display = "block";
        this._pendingFromLastTime = true;
      }
    }
    await this.wait(30);
    if ( this._chronoEntries.length % 7 != 0 || this._chronoEntries.length % 7 == 0 && !this._pendingFromLastTime) 
    {
      this._maxPage = Math.floor(this._chronoEntries.length/7)+1;
    }
    else
    {
      this._maxPage = Math.floor(this._chronoEntries.length/7);
    }
    this._currentPage = this._maxPage;      

    this.UpdateTable(); 
  }
  
  // This displays initial look of the page according to _pendingFromLastTime being true or false
  // It is also automatically called
  ngAfterViewInit():void
  {
    if (!this._pendingFromLastTime) 
    {
      this._startButton.nativeElement.style.display="block";
      this._secondaryStartButton.nativeElement.style.display = "none";
      this._stopButton.nativeElement.style.display="none";      
      this._table.nativeElement.style.display="none";
      this._pagiHandlerTable.nativeElement.style.display = "none";
      this._pagiHandler.nativeElement.innerHTML = "1/1";
    }

    this._modal.nativeElement.style.display="none";
    this._editEntryModal.nativeElement.style.display = "none";
  }

  // Gets called from ClickedStart() when the Start button is clicked
  // It calls HttpPost request with the values of _addDbEntry field
  async AddEntry()
  {
    this._addDbEntry.id = "00000000-0000-0000-0000-000000000000";
    
    this._startTime = new Date();
    this._addDbEntry.startTime = this._startTime.toLocaleString("hr-HR");
    this._addDbEntry.startTime = this._addDbEntry.startTime.substring(0,this._addDbEntry.startTime.length-3); //remove seconds

    this._addDbEntry.name = '...';
    this._addDbEntry.endTime = '...';
    this._addDbEntry.duration = '...';
    this._addDbEntry.startTimeDateMilisec = new Date().getTime().toString();
    

    this.projEntryService.addEntry(this._addDbEntry)
    .subscribe
    ({next: (dbentry) => {this._lastDbEntry = dbentry;},
      error: (response) => {console.log(response);}});
  }


  // It is called when the Edit button is pressed and gets the clicked row from the database
  GetCustomEntry(id:string)
  {
    this.projEntryService.getEntry(id)
    .subscribe
    ({next: (dbentry) => {this._editDbEntry = dbentry;},
      error: (response) => {console.log(response);}});
  }
  
  // Gets all entries from the database
  // Sets _chronoEntries array to the value of all entries and sorts is chronologically
  GetAllEntries()
  {
    this.projEntryService.getAllEntries()
    .subscribe
    ({
      next: (dbentry) => 
      {
        this._chronoEntries = dbentry;
        this._chronoEntries.sort((a, b) => (parseInt(a.startTimeDateMilisec) < parseInt(b.startTimeDateMilisec)) ? -1 : 1) 
        this.UpdateTable();       
      },
      error: (response) => 
      {
        console.log(response);
      }
    })    
  }

  // Gets called when the Stop button is clicked
  // Assigns the name and stop time to the project and calls HttpPut request to update entry in database
  async UpdatePendingEntry()
  {
    await this.wait(30);
    let lastEntry = this._lastDbEntry;
    lastEntry.name = this._addName;
    this._addName = '';
    this._endTime = new Date();
    lastEntry.endTimeDateMilisec = new Date().getTime().toString();


    let endDate = this._endTime.toLocaleString("hr-HR");
    lastEntry.endTime = endDate.substring(0,endDate.length-3);
    lastEntry.duration = this.GetDurationInHoursAndMinutes(this._startTime, this._endTime);;
    

    this.projEntryService.updateEntry(lastEntry.id,lastEntry)
    .subscribe
    ({
      next: (response) =>  {this.UpdateTable();}
    })

    await this.wait(30);
    this.GetAllEntries();

    this.CloseModal();
    this._stopButton.nativeElement.style.display="none";
    this._secondaryStartButton.nativeElement.style.display="block";
    
    //Add more pages
    this._maxPage = Math.floor(this._chronoEntries.length/7)+1;
  }


  //Deletes entry from database by calling HttpDelete request
  DeleteEntry(id: string)
  {
    this.projEntryService.deleteEntry(id).subscribe();
  }
  
  // Deletes all entries in the database by calling DeleteEntry with every id from _chronoEntries
  // Also deletes all values in the main table
  async DeleteAllEntries()
  {
    for (let index = 0; index < this._chronoEntries.length; index++) 
    {
      const element = this._chronoEntries[index];
      this.DeleteEntry(element.id);
    }
    
    this._displayEntries = [];
    this._chronoEntries = [];

    await this.wait(300);
    this._emptyList= new Array(7).fill(null);
    this._maxPage = 1;
    this._currentPage = 1;
    this.UpdateTable();

    this.GetAllEntries()
    await this.wait(30);
    


    if (this._stopButton.nativeElement.style.display == "block") 
    {
      this._stopButton.nativeElement.style.display="none";
      this._secondaryStartButton.nativeElement.style.display="block";  
    }
  }
  
  // Method which enables to stop time for a custom number of miliseconds before the program continues to execute further
  wait(timeToWait:number) 
  {
    return new Promise(resolve => {setTimeout(() => {resolve(resolve);},timeToWait);});
  }

  // Gets called when the start button is clicked
  // Calls AddEntry() to post entry to database
  // Calls UpdateTable() to render the entry on the display
  async ClickedStart()
  {
    if (this._pagiHandlerTable.nativeElement.style.display = "none") 
    {
      this._pagiHandlerTable.nativeElement.style.display = "block";
    }

    this.AddEntry()
    await this.wait(30);
    this.GetAllEntries();
    await this.wait(30);
    this.UpdateTable();     


    this._startButton.nativeElement.style.display="none";
    this._table.nativeElement.style.display="block";
    this._stopButton.nativeElement.style.display="block";
  }

  // Gets called when Stop button is clicked
  // Displays modal window in which user can stop the timer 
  async ClickedStop()
  {
    this._modal.nativeElement.style.display="block";
  }

  // Gets called when > button from Pagination table is clicked
  // Displays the next page of the main table if the last possible page is not displayed currently 
  ClickedNextPage()
  {
    if ( this._currentPage < this._maxPage ) 
    {
      this._currentPage += 1;
      this.UpdateTable();
    }
  }

  // Gets called when < button from Pagination table is clicked
  // Displays the previous page of the main table if the first page is not displayed currently 
  ClickedPreviousPage()
  {
    if ( this._currentPage > 1 ) 
    {
      this._currentPage -= 1;
      this.UpdateTable();
    }  
  }

  // Gets called when the X button of modal windows (ones to finish timer or to edit entry) are pressed and closes them
  CloseModal()
  {
    if (this._modal.nativeElement.style.display="block")
    {
      this._modal.nativeElement.style.display="none";
    }

    if (this._editEntryModal.nativeElement.style.display="block") 
    {
      this._editEntryModal.nativeElement.style.display="none"
    }
  }

  // Gets called when the Stop is clicked or when project's start or end time is edited
  // Calculates the duration of project in hours and minutes 
  GetDurationInHoursAndMinutes(startDate: Date, endDate: Date):  string
  {

      let differ = endDate.getTime() - startDate.getTime();
      let hours = Math.floor(differ / (1000 * 60 * 60)).toString();
      let minutes = Math.floor((differ % (1000 * 60 * 60)) / (1000 * 60)).toString();

      if (hours.length == 1) {hours = "0"+hours}
      if (minutes.length == 1) {minutes = "0"+minutes}

      let diff = hours +":"+ minutes;
      return diff;
  }

  // Gets called from UpdateTable()
  // If table displays less then 7 elements this method creates blank rows in table in order for table to display 7 rows in total
  FillTableWithEmptyRows() 
  {
    if (7-this._displayEntries.length >= 0) 
    {
      this._emptyRowsToFill = 7-this._displayEntries.length;
      this._emptyList = new Array(this._emptyRowsToFill).fill(null);     
    }
  }

  // Gets called from UpdateTable()
  // Displays number of current page and number of maximal possible page of table
  UpdatePagification() 
  {
      this._pagiHandler.nativeElement.innerHTML = this._currentPage.toString()+"/"+this._maxPage.toString();        
  }  

  // Gets called every time there is update in a database - when user deletes all entries, adds a new element, edits an element
  // Also gets called when buttons for navigating trough table (previous and next buttons) are clicked
  // Sets _displayEntries to values from the _chronoEntries
  // Note that table HTML refers to _displayEntries
  UpdateTable() 
  {
    if ( this._chronoEntries.length > this._currentPage*7 ) 
    {
      this._displayEntries = this._chronoEntries.slice(7*(this._currentPage-1),this._currentPage*7);
    }
    else
    {
      this._displayEntries = this._chronoEntries.slice(7*(this._currentPage-1),this._chronoEntries.length);
    }
    this.FillTableWithEmptyRows();
    this.UpdatePagification();   
  }  

  // Gets called when Edit button is clicked
  // Checks if Edit button is clicked after user ended the project entry, if so the modal window to edit the project is displayed
  // It also sets id to the entry field that needs to be edited so it's values can be pulled from database
  EditEntry(stop:string, id:string)
  {
    if (stop != '...') 
    {
      this._editDbEntry.id = id;
      this._editEntryModal.nativeElement.style.display="block";
    }
  }


  // Gets called when the Update Entry button from Edit modal window is clicked
  // Takes all inputs from modal window (name, start time, end time) and updates values in database
  // Calculates the difference in start time and end time and displays it, displays invalid if start time is greater than end time 
  // Also displays invalid if one of the times is in the future 
  async FinishEditing()
  {
    this.GetCustomEntry( this._editDbEntry.id);
    await this.wait(30);
    this._editEndTime = new Date(this._editEndTime.valueOf().toString());

    if (this._editEndTime.getTime() > 0) 
    {
      this._editDbEntry.endTime = this._editEndTime.toLocaleString("hr-HR");
      this._editDbEntry.endTime = this._editDbEntry.endTime.substring(0,this._editDbEntry.endTime.length-3)

      this._editDbEntry.endTimeDateMilisec = this._editEndTime.getTime().toString();
    }

    this._editStartTime = new Date(this._editStartTime.valueOf().toString());

    if (this._editStartTime.getTime() > 0) 
    {
      this._editDbEntry.startTime = this._editStartTime.toLocaleString("hr-HR");
      this._editDbEntry.startTime = this._editDbEntry.startTime.substring(0,this._editDbEntry.startTime.length-3)

      this._editDbEntry.startTimeDateMilisec = this._editStartTime.getTime().toString();
    }   
    await this.wait(100);

    if (parseInt(this._editDbEntry.endTimeDateMilisec) > new Date().getTime() || parseInt(this._editDbEntry.startTimeDateMilisec) > new Date().getTime()) 
    {
      this._editDbEntry.duration = 'invalid';
    }

    else if ( parseInt(this._editDbEntry.endTimeDateMilisec) > parseInt(this._editDbEntry.startTimeDateMilisec)) 
    {
      this._editDbEntry.duration = this.GetDurationInHoursAndMinutes(new Date(parseInt(this._editDbEntry.startTimeDateMilisec)),new Date(parseInt(this._editDbEntry.endTimeDateMilisec)))
    }    

    else
    {
      this._editDbEntry.duration = 'invalid';
    }

    if (this._editName != '') 
    {
      this._editDbEntry.name = this._editName;
    }

    this.projEntryService.updateEntry(this._editDbEntry.id,this._editDbEntry)
    .subscribe();
    await this.wait(30);
    this.GetAllEntries();
    await this.wait(30);
    this.UpdateTable();    
    this._editEntryModal.nativeElement.style.display="none";
  }

  // Gets called when Export to Excel button is clicked
  // Gets every page of the main table and saves it to a different sheet of an excel file and promts user to save .xlsx file 
  async ExportToExcel()
  {
    this._currentPage = 1;
    this.UpdateTable();
    await this.wait(60);

    var wb: XLSX.WorkBook = XLSX.utils.book_new();
    let element = document.getElementById('excel-table');
    var ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);

    for (let index = 1; index <= this._maxPage; index++) 
    {
      let element = document.getElementById('excel-table');
      var ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet'+this._currentPage);
      this.ClickedNextPage();      
      await this.wait(60);
    }
    XLSX.writeFile(wb, this._fileName);
  }
}



