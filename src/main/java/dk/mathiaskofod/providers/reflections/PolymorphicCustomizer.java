package dk.mathiaskofod.providers.reflections;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.NamedType;
import dk.mathiaskofod.services.session.annotations.EventCategory;
import dk.mathiaskofod.services.session.annotations.EventType;
import io.quarkus.jackson.ObjectMapperCustomizer;
import jakarta.inject.Singleton;
import lombok.extern.slf4j.Slf4j;
import org.reflections.Reflections;


import java.util.Set;

@Singleton
@Slf4j
public class PolymorphicCustomizer implements ObjectMapperCustomizer {

        // Base package to scan for classes annotated with EventCategory and EventType
    private final String BASE_PACKAGE_TO_SCAN = "dk.mathiaskofod";

    /**
     * This is mostly a mix of copy-paste from different guides and blogs found online. But this class makes the code
     * so much better by automatically registering subtypes for polymorphic deserialization.
     * @param objectMapper The object mapper to customize
     */
    @Override
    public void customize(ObjectMapper objectMapper) {

        log.info("Here we go again...");

        Reflections reflections = new Reflections(BASE_PACKAGE_TO_SCAN);


        Set<Class<?>> eventCategorySubtypes = reflections.getTypesAnnotatedWith(EventCategory.class);
        Set<Class<?>> eventTypeSubtypes = reflections.getTypesAnnotatedWith(EventType.class);

        for (Class<?> subType : eventCategorySubtypes) {
            EventCategory annotation = subType.getAnnotation(EventCategory.class);
            if (annotation != null) {
                String typeName = annotation.value();
                objectMapper.registerSubtypes(new NamedType(subType, typeName));
            }
        }

        for (Class<?> subType : eventTypeSubtypes) {
            EventType annotation = subType.getAnnotation(EventType.class);
            if (annotation != null) {
                String typeName = annotation.value();
                objectMapper.registerSubtypes(new NamedType(subType, typeName));
            }
        }
    }
}