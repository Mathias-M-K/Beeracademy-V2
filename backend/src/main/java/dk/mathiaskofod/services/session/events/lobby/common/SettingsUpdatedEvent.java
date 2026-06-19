package dk.mathiaskofod.services.session.events.lobby.common;

import dk.mathiaskofod.services.session.actions.lobby.common.UpdateSettingsAction;
import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.LobbyParticipantEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("SETTINGS_UPDATED")
public record SettingsUpdatedEvent(String participantId, int sipsInABeer, boolean canDrawAce)
        implements LobbyParticipantEvent, LobbyClientEvent {

    public static SettingsUpdatedEvent fromAction(String participantId, UpdateSettingsAction action) {
        return new SettingsUpdatedEvent(participantId, action.getSipsInABeer(), action.canDrawAce());
    }
}
