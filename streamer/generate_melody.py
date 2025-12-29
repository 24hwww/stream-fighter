import wave
import struct
import math

def generate_8bit_melody(filename, duration_per_note=0.5, sample_rate=44100):
    # Notes frequencies (C4, E4, G4, C5)
    notes = [261.63, 329.63, 392.00, 523.25]
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)   # 16-bit
        wav_file.setframerate(sample_rate)
        
        for freq in notes:
            num_samples = int(duration_per_note * sample_rate)
            for i in range(num_samples):
                # Square wave: +1 or -1
                # Value = amplitude * sign(sin(2 * pi * frequency * t))
                t = float(i) / sample_rate
                value = 16000 * (1 if math.sin(2 * math.pi * freq * t) > 0 else -1)
                data = struct.pack('<h', int(value))
                wav_file.writeframesraw(data)

if __name__ == "__main__":
    generate_8bit_melody("melody.wav")
    print("Melody generated successfully!")
