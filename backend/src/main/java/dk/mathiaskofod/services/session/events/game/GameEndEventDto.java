package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.events.EndGameEvent;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.session.models.annotations.EventType;

import java.util.List;

@EventType("GAME_END")
public record GameEndEventDto(GameReport gameReport, List<PlayerReport> playerReports, TimerReports timerReports) implements GameEventDto {
    /**
     * Create a GameEndEventDto from an EndGameEvent.
     *
     * @param event the source event providing gameReport, playerReports, and timerReports
     * @return the constructed GameEndEventDto containing the event's gameReport, playerReports, and timerReports
     */
    public static GameEndEventDto fromGameEvent(EndGameEvent event){
        return new GameEndEventDto(event.gameReport(), event.playerReports(), event.timerReports());
    }
}