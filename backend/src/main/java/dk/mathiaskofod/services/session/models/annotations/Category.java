package dk.mathiaskofod.services.session.models.annotations;


import io.quarkus.runtime.annotations.RegisterForReflection;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@RegisterForReflection
public @interface Category {
    String value();
}
