package dk.mathiaskofod.common.dto.participant;

import jakarta.validation.constraints.Pattern;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(name = "ParticipantId", description = "Identifies a participant, both while in lobby and game")
public record ParticipantIdDto(
        @Pattern(regexp = ParticipantIdDto.PATTERN, message = ParticipantIdDto.MESSAGE)
        String id) {
    public static final String PATTERN = "^[A-Za-z0-9]{12}$";
    public static final String MESSAGE = "Invalid participant ID format";

    public ParticipantIdDto(String id) {
        this.id = id.replace("-", "");
    }
}
