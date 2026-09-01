package dk.mathiaskofod.common.dto.party;

import jakarta.validation.constraints.Pattern;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.jboss.resteasy.reactive.RestPath;

@Schema(
        name = "PartyId",
        description =
                "Identifies a party. Nine alphanumeric characters. Dashes are accepted for readability and stripped before validation, so 'A1B2C3D4E' and 'A1B-2C3-D4E' refer to the same party.")
public record PartyIdDto(
        @RestPath
        @Schema(description = "The nine-character party ID.", required = true)
        @Pattern(regexp = PartyIdDto.PATTERN, message = PartyIdDto.MESSAGE)
        String partyId) {

    public static final String PATTERN = "^[A-Za-z0-9]{9}$";
    public static final String MESSAGE = "Invalid party ID format";

    public PartyIdDto(String partyId) {
        this.partyId = partyId.replace("-", "");
    }
}
