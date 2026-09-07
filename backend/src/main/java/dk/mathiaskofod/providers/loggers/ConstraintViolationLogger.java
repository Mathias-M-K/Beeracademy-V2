package dk.mathiaskofod.providers.loggers;

import dk.mathiaskofod.helpers.CorrIdHelper;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.Priorities;
import lombok.extern.slf4j.Slf4j;
import org.jboss.resteasy.reactive.server.ServerResponseFilter;

@Slf4j
public class ConstraintViolationLogger {

    @ServerResponseFilter(priority = Priorities.USER + 1000)
    public void logConstraintViolations(Throwable throwable) {

        if (!(throwable instanceof ConstraintViolationException exception)) {
            return;
        }

        String corrId = CorrIdHelper.getCorrId().orElse("");

        exception.getConstraintViolations()
                .forEach(violation -> log.warn("Constraint violation. Path:{}, Message:{}, CorrId:{}",
                        violation.getPropertyPath(), violation.getMessage(), corrId));
    }
}