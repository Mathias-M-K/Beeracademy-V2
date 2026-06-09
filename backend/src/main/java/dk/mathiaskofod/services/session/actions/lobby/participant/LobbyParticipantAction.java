package dk.mathiaskofod.services.session.actions.lobby.participant;

import com.fasterxml.jackson.annotation.JsonTypeInfo;


@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
public interface LobbyParticipantAction {}
