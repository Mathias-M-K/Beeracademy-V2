package dk.mathiaskofod.helpers;

import org.slf4j.MDC;
import java.util.Optional;

public class CorrIdHelper {

    private CorrIdHelper() {
        /* This utility class should not be instantiated */
    }


    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    public static void setCorrId(String corrId){
        MDC.put(CORRELATION_ID_HEADER, corrId);
    }

    public static Optional<String> getCorrId(){
        return Optional.ofNullable(MDC.get(CORRELATION_ID_HEADER));
    }

    public static void removeCorrId(){
        MDC.remove(CORRELATION_ID_HEADER);
    }
}
