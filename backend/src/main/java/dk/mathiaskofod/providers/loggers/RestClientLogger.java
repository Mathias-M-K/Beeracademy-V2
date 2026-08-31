package dk.mathiaskofod.providers.loggers;

import dk.mathiaskofod.helpers.CorrIdHelper;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Provider
public class RestClientLogger implements ContainerRequestFilter, ContainerResponseFilter {

    @Inject
    RequestTimer timer;

    @Override
    public void filter(ContainerRequestContext requestContext) {

        Optional<String> downstreamCorrId = Optional.ofNullable(requestContext.getHeaderString(CorrIdHelper.CORRELATION_ID_HEADER));
        String corrID = downstreamCorrId.orElse(IdGenerator.generateCorrelationId());

        CorrIdHelper.setCorrId(corrID);
        timer.startTime();

        String method = requestContext.getMethod();
        String uri = requestContext.getUriInfo().getPath();

        log.info("Request: {} {}", method, uri);
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {

        String method = requestContext.getMethod();
        String uri = requestContext.getUriInfo().getPath();
        int status = responseContext.getStatus();

        int elapsedTime = timer.getResponseTime();
        log.info("Response: {} {}, Status: {}, duration: {}ms", method, uri, status, elapsedTime);

        CorrIdHelper.removeCorrId();
    }
}
