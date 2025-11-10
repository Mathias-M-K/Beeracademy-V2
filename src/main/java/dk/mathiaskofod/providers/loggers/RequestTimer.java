package dk.mathiaskofod.providers.loggers;

import jakarta.enterprise.context.RequestScoped;

import java.time.Instant;

@RequestScoped
public class RequestTimer {


    private Instant startTime;

    public void startTime(){
        this.startTime = Instant.now();
    }

    public int getResponseTime() {
        if (startTime == null) {
            return 0;
        }
        Instant endTime = Instant.now();
        return (int) (endTime.toEpochMilli() - startTime.toEpochMilli());
    }
}
