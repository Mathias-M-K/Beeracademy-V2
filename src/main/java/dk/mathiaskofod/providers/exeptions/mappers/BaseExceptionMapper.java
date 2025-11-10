package dk.mathiaskofod.providers.exeptions.mappers;

import dk.mathiaskofod.providers.exeptions.BaseException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class BaseExceptionMapper implements ExceptionMapper<BaseException> {

    @Override
    public Response toResponse(BaseException exception) {
        String cause = exception.getCause() == null ? "" : exception.getCause().getClass().getSimpleName();
        return Response.status(exception.httpStatus)
                .entity(new ExceptionResponse(exception.getClass().getSimpleName(),cause,exception.getMessage()))
                .build();
    }
}
