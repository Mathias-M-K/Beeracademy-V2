
//-----------------------------------------------
#define CLK D2
#define DT D3
#define SW D5
//-----------------------------------------------
int counter = 0;
int currentCLK;
int previousCLK;
String encdir = "";
//=========================================================
void setup() {
  pinMode(CLK, INPUT_PULLUP);
  pinMode(DT, INPUT_PULLUP);
  pinMode(SW, INPUT_PULLUP);

  pinMode(LED_BUILTIN, OUTPUT);

  Serial.begin(9600);

  previousCLK = digitalRead(CLK);
}
//=========================================================
void loop() {
  bool counterReset = false;
  if (digitalRead(SW) == LOW) {
    counter = 0;
    counterReset = true;
  }
  currentCLK = digitalRead(CLK);
  if (currentCLK != previousCLK || counterReset) {
    if (digitalRead(DT) != currentCLK) {
      counter++;
      encdir = "clockwise";
    } else {
      counter--;
      encdir = "counterclk";
    }

    Serial.print("{\"state\":\"pot\",\"val\":\"");
    Serial.print(counter);
    Serial.println("\"}");
  }
  previousCLK = currentCLK;

  if (Serial.available()) {
    // Read until the newline character is received
    String serialInput = Serial.readStringUntil('\n');
    handleSerialInput(serialInput);
  }
}

void handleSerialInput(String serialInput) {

  serialInput.toLowerCase();
  serialInput.trim();

  Serial.print("{\"state\":\"light\",\"val\":\"");
  Serial.print(serialInput);
  Serial.println("\"}");

  if (serialInput == "on") {
    digitalWrite(LED_BUILTIN, LOW);
  }

  if (serialInput == "off") {
    digitalWrite(LED_BUILTIN, HIGH);
  }
}