package dk.mathiaskofod.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import dk.mathiaskofod.services.event.publisher.SseEventPublisher;

@AnalyzeClasses(packages = "dk.mathiaskofod", importOptions = {ImportOption.DoNotIncludeTests.class})
class SseEventPublisherAccessTest {

    @ArchTest
    static final ArchRule the_connection_event_stream_is_only_consumed_by_the_api_layer = methods()
            .that()
            .areDeclaredIn(SseEventPublisher.class)
            .and()
            .haveName("playerConnectionEventStream")
            .should()
            .onlyBeCalled()
            .byClassesThat()
            .resideInAPackage("dk.mathiaskofod.api..")
            .because(
                    "the SSE stream is a transport concern: only the API layer subscribes to it, everything else publishes into it");

    @ArchTest
    static final ArchRule connection_events_are_only_published_from_the_services_layer = methods()
            .that()
            .areDeclaredIn(SseEventPublisher.class)
            .and()
            .haveName("publishNewConnectionEvent")
            .should()
            .onlyBeCalled()
            .byClassesThat()
            .resideInAPackage("dk.mathiaskofod.services..")
            .because("connection events originate from session/game state changes, never from an inbound HTTP call");
}
