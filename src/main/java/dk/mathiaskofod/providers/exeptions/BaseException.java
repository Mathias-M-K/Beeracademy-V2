package dk.mathiaskofod.providers.exeptions;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class BaseException extends RuntimeException {

    public int httpStatus;

    public BaseException(String message, int httpStatus) {
        super(message);
        this.httpStatus = httpStatus;

        log.warn("{} - Message: {}", this.getClass().getSimpleName(),message);
    }
}
