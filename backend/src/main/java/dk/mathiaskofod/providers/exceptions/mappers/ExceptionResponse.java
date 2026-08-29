package dk.mathiaskofod.providers.exceptions.mappers;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Exception response")
public record ExceptionResponse(String exception, String cause, String message, String corrId) {}
