import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild} from '@angular/core';

interface SerialInput {
  state: string;
  val: string;
}

@Component({
  selector: 'app-serial-playground',
  templateUrl: './serial-playground.html',
  styleUrl: './serial-playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SerialPlayground {

  @ViewChild('scrollMe')
  private myScrollContainer!: ElementRef;

  public currentPotValue: string = '0';
  public currentLightState: string = 'off';
  public messages: string[] = [];

  serialSupported: boolean;

  private reader!: ReadableStreamDefaultReader;
  private writer!: WritableStreamDefaultWriter;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  private writerClosePromise!: Promise<void>;

  private keepReading: boolean = true;

  private port!: any;

  constructor(private cdr: ChangeDetectorRef) {


    this.serialSupported = "serial" in window.navigator;

    console.log("Navigator", window.navigator);


  }

  async connectSerial() {

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({baudRate: 9600}); // Consider 115200 for even better speed

      // 2. Access the writer directly from the port
      this.writer = this.port.writable.getWriter();

      console.log("Serial Connected & Ready");
    } catch (e) {
      console.error(e);
    }
  }

  async disconnectSerial() {
    this.keepReading = false;

    await this.reader.cancel();
    await this.writerClosePromise;
    this.writer.releaseLock();
    this.port.close();
  }

  async sendCommand(command: string) {
    if (this.writer) {
      await this.writer.write(this.encoder.encode(command + '\n'));
    }
  }

  public userInitiateSerialData() {
    this.writerClosePromise = this.checkSerialData();
  }

  private async checkSerialData() {

    this.reader = this.port.readable.getReader();

    let buffer = "";

    while (this.port.readable && this.keepReading) {

      try {
        while (true) {

          const {value, done} = await this.reader.read();

          if (done) {
            break;
          }

          const text = this.decoder.decode(value);
          text.trim();

          buffer += text;

          const newMessages: string[] = buffer.split("\n");

          for (const message of newMessages) {
            const isComplete = message.startsWith("{") && message.endsWith("\r");
            if (isComplete) {
              this.handleSerialData(message);
            }
          }

          buffer = buffer.substring(buffer.lastIndexOf("\n"), buffer.length);

        }
      } catch (error) {
        console.error("Some error happened with serial communication", error);
        break;
      } finally {
        this.reader.releaseLock();
      }
    }

  }

  private handleSerialData(value: string) {
    const valueAsJson: SerialInput = JSON.parse(value);
    console.log(valueAsJson);

    if (valueAsJson.state === 'pot'){
      console.log("Pot value changed:", valueAsJson.val);
      this.currentPotValue = valueAsJson.val;
    }

    if(valueAsJson.state === 'light'){
      console.log("Light value changed:", valueAsJson.val);
      this.currentLightState = valueAsJson.val;
    }

    this.messages.push(value);
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.myScrollContainer.nativeElement.scrollTop =
      this.myScrollContainer.nativeElement.scrollHeight;
  }

}
