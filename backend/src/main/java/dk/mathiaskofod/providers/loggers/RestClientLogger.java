package dk.mathiaskofod.providers.loggers;

import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

import java.util.Optional;



@Slf4j
@Provider
public class RestClientLogger implements ContainerRequestFilter, ContainerResponseFilter {

    @Inject
    RequestTimer timer;

    @SuppressWarnings("FieldCanBeLocal")
    private final String CORRELATION_ID_HEADER = "X-Correlation-ID";


    @Override
    public void filter(ContainerRequestContext requestContext)  {

        Optional<String> correlationId = Optional.ofNullable(requestContext.getHeaderString(CORRELATION_ID_HEADER));


        MDC.put(CORRELATION_ID_HEADER,correlationId.orElse(IdGenerator.generateCorrelationId()));
        timer.startTime();

        String method = requestContext.getMethod();
        String uri = requestContext.getUriInfo().getPath();

        log.info("Request: {} {}", method, uri);
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)  {

        String method = requestContext.getMethod();
        String uri = requestContext.getUriInfo().getPath();
        int status = responseContext.getStatus();



        int elapsedTime = timer.getResponseTime();
        log.info("Response: {} {}, Status: {}, duration: {}ms", method, uri, status, elapsedTime);

        MDC.remove(CORRELATION_ID_HEADER);
    }
}
