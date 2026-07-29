package dk.mathiaskofod.providers.openapi;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.eclipse.microprofile.openapi.OASFactory;
import org.eclipse.microprofile.openapi.models.OpenAPI;
import org.eclipse.microprofile.openapi.models.media.Schema;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class WebsocketCodeSchemaFilterTest {

    private final WebsocketCodeSchemaFilter filter = new WebsocketCodeSchemaFilter();

    private OpenAPI openApiWithStringEnum() {
        Schema schema = OASFactory.createSchema()
                .type(List.of(Schema.SchemaType.STRING))
                .enumeration(List.of("SESSION_NOT_FOUND", "LOBBY_LEADER_LEFT", "KICKED", "TRANSITIONING"));

        return OASFactory.createOpenAPI()
                .components(OASFactory.createComponents().addSchema("CustomWebsocketCodes", schema));
    }

    @DisplayName("The CustomWebsocketCodes schema is rewritten to an integer enum of the numeric close codes")
    @Test
    void rewritesToIntegerEnum() {
        // Arrange
        OpenAPI openAPI = openApiWithStringEnum();

        // Act
        filter.filterOpenAPI(openAPI);

        // Assert
        Schema schema = openAPI.getComponents().getSchemas().get("CustomWebsocketCodes");
        assertTrue(schema.getType().contains(Schema.SchemaType.INTEGER));
        assertEquals("int32", schema.getFormat());
        assertEquals(List.of(4000, 4010, 4020, 4030), schema.getEnumeration());
    }

    @DisplayName("The rewritten schema keeps member names via the x-enum-varnames extension")
    @Test
    void addsPascalCaseVarNames() {
        // Arrange
        OpenAPI openAPI = openApiWithStringEnum();

        // Act
        filter.filterOpenAPI(openAPI);

        // Assert
        Schema schema = openAPI.getComponents().getSchemas().get("CustomWebsocketCodes");
        assertEquals(
                List.of("SessionNotFound", "LobbyLeaderLeft", "Kicked", "Transitioning"),
                schema.getExtensions().get("x-enum-varnames"));
    }

    @DisplayName("The filter is a no-op when the schema is absent")
    @Test
    void noopWhenSchemaMissing() {
        // Arrange
        OpenAPI openAPI = OASFactory.createOpenAPI().components(OASFactory.createComponents());

        // Act & Assert
        assertDoesNotThrow(() -> filter.filterOpenAPI(openAPI));
    }

    @DisplayName("The filter is a no-op when there are no components")
    @Test
    void noopWhenComponentsMissing() {
        // Arrange
        OpenAPI openAPI = OASFactory.createOpenAPI();

        // Act & Assert
        assertDoesNotThrow(() -> filter.filterOpenAPI(openAPI));
    }
}
