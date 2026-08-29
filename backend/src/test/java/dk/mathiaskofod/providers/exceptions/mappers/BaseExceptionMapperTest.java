package dk.mathiaskofod.providers.exceptions.mappers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.services.party.exceptions.PartyNotFoundException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

class BaseExceptionMapperTest {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    private final BaseExceptionMapper mapper = new BaseExceptionMapper();

    @AfterEach
    void tearDown() {

        // MDC is thread local, so it has to be cleared to keep it out of the other tests on this thread
        MDC.clear();
    }

    @DisplayName("An exception without a cause is mapped to its status and an empty cause")
    @Test
    void exceptionWithoutCauseIsMapped() {

        // Arrange
        PartyNotFoundException exception = new PartyNotFoundException("123456789");

        // Act
        Response response = mapper.toResponse(exception);

        // Assert
        assertEquals(404, response.getStatus());

        ExceptionResponse entity = (ExceptionResponse) response.getEntity();
        assertEquals("PartyNotFoundException", entity.exception());
        assertEquals("", entity.cause());
        assertEquals("Party 123456789 was not found", entity.message());
    }

    @DisplayName("The cause is reported by its simple class name")
    @Test
    void causeIsReportedBySimpleClassName() {

        // Arrange
        BaseException exception = new BaseException("Something broke", 500, new IllegalStateException("root cause"));

        // Act
        Response response = mapper.toResponse(exception);

        // Assert
        assertEquals(500, response.getStatus());

        ExceptionResponse entity = (ExceptionResponse) response.getEntity();
        assertEquals("BaseException", entity.exception());
        assertEquals("IllegalStateException", entity.cause());
        assertEquals("Something broke", entity.message());
    }

    @DisplayName("The correlation id is taken from MDC")
    @Test
    void correlationIdIsTakenFromMdc() {

        // Arrange
        MDC.put(CORRELATION_ID_HEADER, "corr-123");

        // Act
        Response response = mapper.toResponse(new PartyNotFoundException("123456789"));

        // Assert
        assertEquals("corr-123", ((ExceptionResponse) response.getEntity()).corrId());
    }

    @DisplayName("The correlation id is null when MDC holds none")
    @Test
    void correlationIdIsNullWhenMdcHoldsNone() {

        // Act
        Response response = mapper.toResponse(new PartyNotFoundException("123456789"));

        // Assert
        assertNull(((ExceptionResponse) response.getEntity()).corrId());
    }
}
