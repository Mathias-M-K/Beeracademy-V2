package dk.mathiaskofod.providers.exceptions;

import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
public class BaseException extends RuntimeException {

    public final int httpStatus;

    public BaseException(String message, int httpStatus) {
        super(message);
        this.httpStatus = httpStatus;

        log.warn("{} - Message: {}", this.getClass().getSimpleName(), message);
    }

    public BaseException(String message, int httpStatus, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;

        String causeStr = Optional.ofNullable(cause)
                .map(c -> c.getClass().getSimpleName())
                .orElse("");

        log.warn("{} - Message: {}, Cause:{}", this.getClass().getSimpleName(), message, causeStr);
    }
}
