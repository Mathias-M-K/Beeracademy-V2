package dk.mathiaskofod.providers.openapi;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import org.eclipse.microprofile.openapi.OASFactory;
import org.eclipse.microprofile.openapi.models.Components;
import org.eclipse.microprofile.openapi.models.OpenAPI;
import org.eclipse.microprofile.openapi.models.media.Schema;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class WebsocketCodeSchemaFilterTest {

    private final WebsocketCodeSchemaFilter filter = new WebsocketCodeSchemaFilter();

    private OpenAPI openApiWithStringEnum() {
        Schema schema = OASFactory.createSchema()
                .type(List.of(Schema.SchemaType.STRING))
                .enumeration(List.of(
                        "GOING_AWAY",
                        "ABNORMAL_CLOSURE",
                        "SERVICE_RESTART",
                        "TRY_AGAIN_LATER",
                        "SESSION_NOT_FOUND",
                        "LOBBY_NOT_FOUND",
                        "GAME_NOT_FOUND",
                        "LOBBY_LEADER_LEFT",
                        "KICKED",
                        "TRANSITIONING"));

        return OASFactory.createOpenAPI()
                .components(OASFactory.createComponents().addSchema("WebsocketCodes", schema));
    }

    @DisplayName("The WebsocketCodes schema is rewritten to an integer enum of the numeric close codes")
    @Test
    void rewritesToIntegerEnum() {
        // Arrange
        OpenAPI openAPI = openApiWithStringEnum();

        // Act
        filter.filterOpenAPI(openAPI);

        // Assert
        Schema schema = openAPI.getComponents().getSchemas().get("WebsocketCodes");
        assertTrue(schema.getType().contains(Schema.SchemaType.INTEGER));
        assertEquals("int32", schema.getFormat());
        assertEquals(
                List.of(1001, 1006, 1012, 1013, 4000, 4001, 4002, 4010, 4020, 4030), schema.getEnumeration());
    }

    @DisplayName("The rewritten schema keeps member names via the x-enum-varnames extension")
    @Test
    void addsPascalCaseVarNames() {
        // Arrange
        OpenAPI openAPI = openApiWithStringEnum();

        // Act
        filter.filterOpenAPI(openAPI);

        // Assert
        Schema schema = openAPI.getComponents().getSchemas().get("WebsocketCodes");
        assertEquals(
                List.of(
                        "GoingAway",
                        "AbnormalClosure",
                        "ServiceRestart",
                        "TryAgainLater",
                        "SessionNotFound",
                        "LobbyNotFound",
                        "GameNotFound",
                        "LobbyLeaderLeft",
                        "Kicked",
                        "Transitioning"),
                schema.getExtensions().get("x-enum-varnames"));
    }

    @DisplayName("The filter is a no-op when the schema is absent")
    @Test
    void noopWhenSchemaMissing() {
        // Arrange - a non-null schemas map that does not contain the WebsocketCodes schema
        OpenAPI openAPI = OASFactory.createOpenAPI()
                .components(OASFactory.createComponents()
                        .addSchema("SomethingElse", OASFactory.createSchema().type(List.of(Schema.SchemaType.STRING))));

        // Act & Assert
        assertDoesNotThrow(() -> filter.filterOpenAPI(openAPI));
    }

    @DisplayName("The filter is a no-op when there are no components")
    @Test
    void noopWhenComponentsMissing() {
        // Arrange
        OpenAPI openAPI = mock(OpenAPI.class);
        when(openAPI.getComponents()).thenReturn(null);

        // Act & Assert
        assertDoesNotThrow(() -> filter.filterOpenAPI(openAPI));
    }

    @DisplayName("The filter is a no-op when the components hold no schemas map")
    @Test
    void noopWhenSchemasNull() {
        // Arrange
        Components components = mock(Components.class);
        when(components.getSchemas()).thenReturn(null);
        OpenAPI openAPI = mock(OpenAPI.class);
        when(openAPI.getComponents()).thenReturn(components);

        // Act & Assert
        assertDoesNotThrow(() -> filter.filterOpenAPI(openAPI));
    }
}
