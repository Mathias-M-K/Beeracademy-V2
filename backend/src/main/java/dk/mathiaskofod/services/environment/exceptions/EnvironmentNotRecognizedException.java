package dk.mathiaskofod.services.environment.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class EnvironmentNotRecognizedException extends BaseException {

    public EnvironmentNotRecognizedException(String env, Throwable cause) {
        super("Invalid environment: " + env, 500, cause);
    }
}
