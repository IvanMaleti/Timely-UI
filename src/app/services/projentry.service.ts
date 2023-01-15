import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DbEntry } from '../models/DbEntry.component';

@Injectable({
  providedIn: 'root'
})
export class ProjentryService {
  baseApiUrl: string = "https://localhost:7158"; //Maybe needs change on another PC
  constructor(private http: HttpClient) { }

  //Functions below are the bridge to HttpPost, HttpGet, HttpPut and HttpDelete requests
  getAllEntries() : Observable<DbEntry[]>
  {
    return this.http.get<DbEntry[]>(this.baseApiUrl+"/api/Timely");
  }

  addEntry(addEntry: DbEntry): Observable<DbEntry>
  {
    return this.http.post<DbEntry>(this.baseApiUrl+"/api/Timely", addEntry);
  }

  getEntry(id: string): Observable<DbEntry>
  {
     return this.http.get<DbEntry>(this.baseApiUrl+"/api/Timely/"+id)
  }

  updateEntry(id: string, updateEntry: DbEntry): Observable<DbEntry>
  {
    return this.http.put<DbEntry>(this.baseApiUrl+"/api/Timely/"+id,updateEntry)
  }

  deleteEntry(id: string): Observable <DbEntry>
  {
    return this.http.delete<DbEntry>(this.baseApiUrl+"/api/Timely/"+id)
  }
}
