package dk.mathiaskofod.providers.exceptions.mappers;

import dk.mathiaskofod.providers.exceptions.BaseException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

@Slf4j
@Provider
public class BaseExceptionMapper implements ExceptionMapper<BaseException> {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    @Override
    public Response toResponse(BaseException exception) {

        String corrId = MDC.get(CORRELATION_ID_HEADER);

        String cause = exception.getCause() == null
                ? ""
                : exception.getCause().getClass().getSimpleName();
        return Response.status(exception.httpStatus)
                .entity(new ExceptionResponse(exception.getClass().getSimpleName(), cause, exception.getMessage(), corrId))
                .build();
    }
}
