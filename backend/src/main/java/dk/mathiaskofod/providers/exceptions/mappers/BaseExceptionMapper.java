package dk.mathiaskofod.providers.exceptions.mappers;

import dk.mathiaskofod.helpers.CorrIdHelper;
import dk.mathiaskofod.providers.exceptions.BaseException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
@Provider
public class BaseExceptionMapper implements ExceptionMapper<BaseException> {


    @Override
    public Response toResponse(BaseException exception) {

        String corrId = CorrIdHelper.getCorrId().orElse("");

        String cause = Optional.ofNullable(exception.getCause())
                .map(throwable -> throwable.getClass().getSimpleName())
                .orElse("");

        return Response.status(exception.httpStatus)
                .entity(new ExceptionResponse(exception.getClass().getSimpleName(), cause, exception.getMessage(), corrId))
                .build();
    }
}
