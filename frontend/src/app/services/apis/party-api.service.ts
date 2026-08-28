import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigService} from '../../../config.service';
import {map, Observable} from 'rxjs';
import {PartyDto} from '../../../api-models/model/partyDto';

@Injectable({
  providedIn: 'root',
})
export class PartyApiService {

  private readonly appConfig: ConfigService = inject(ConfigService)
  private readonly apiUrl: string = this.appConfig.apiUrl + "/api";

  private readonly httpClient = inject(HttpClient);


  public getParty(partyId: string): Observable<PartyDto> {

    console.debug("Getting party:", partyId);
    return this.httpClient.get<PartyDto>(this.apiUrl + '/parties/' + partyId)
      .pipe(
        map(partyStateDto => partyStateDto)
      );
  }


}
