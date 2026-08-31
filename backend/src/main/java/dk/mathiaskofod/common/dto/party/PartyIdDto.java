package dk.mathiaskofod.common.dto.party;

import jakarta.validation.constraints.Pattern;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.jboss.resteasy.reactive.RestPath;

@Schema()
public record PartyIdDto(
        @RestPath
        @Pattern(regexp = PartyIdDto.PATTERN, message = PartyIdDto.MESSAGE)
        String partyId) {

    public static final String PATTERN = "^[A-Za-z0-9]{9}$";
    public static final String MESSAGE = "Invalid party ID format";

    public PartyIdDto(String partyId) {
        this.partyId = partyId.replace("-", "");
    }
}
