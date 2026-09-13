import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigService} from '../../../config.service';
import {map, Observable} from 'rxjs';
import {PartyDto} from '../../../api-models/model/partyDto';
import {CurrentPartyDto} from '../../../api-models/model/currentPartyDto';

@Service()
export class PartyApi {

  private readonly appConfig: ConfigService = inject(ConfigService)
  private readonly apiUrl: string = this.appConfig.apiUrl + "/api";

  private readonly httpClient = inject(HttpClient);


  public getParty(partyId: string): Observable<PartyDto> {

    return this.httpClient.get<PartyDto>(`${this.apiUrl}/parties/${partyId}`)
      .pipe(
        map(partyStateDto => partyStateDto)
      );
  }

  public getCurrentParty(): Observable<CurrentPartyDto> {
    return this.httpClient.get<CurrentPartyDto>(`${this.apiUrl}/parties/current`, {withCredentials: true});
  }


}
