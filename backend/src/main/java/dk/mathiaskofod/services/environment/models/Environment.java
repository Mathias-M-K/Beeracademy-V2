package dk.mathiaskofod.services.environment.models;

import dk.mathiaskofod.services.environment.exceptions.EnvironmentNotRecognizedException;

public enum Environment {
    TEST,
    DEV,
    PROD;

    public static Environment fromString(String env) {
        try {
            return Environment.valueOf(env.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new EnvironmentNotRecognizedException(env, e);
        }
    }
}
