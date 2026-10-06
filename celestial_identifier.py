import cv2
import numpy as np


class CelestialDetector:
    """Astronomical feature detection & tracking engine using OpenCV."""
    
    def __init__(self, min_brightness=190, min_area=4):
        self.min_brightness = min_brightness
        self.min_area = min_area

    def process_frame(self, frame):
        """Analyze image frame for celestial object contours and centroids."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Segment bright celestial sources against dark space background
        _, thresh = cv2.threshold(blurred, self.min_brightness, 255, cv2.THRESH_BINARY)
        
        # Extract object boundaries
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detections = []
        for idx, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area >= self.min_area:
                M = cv2.moments(contour)
                if M["m00"] != 0:
                    cX = int(M["m10"] / M["m00"])
                    cY = int(M["m01"] / M["m00"])
                    
                    label = f"Obj-{idx + 1}"
                    detections.append({
                        'id': idx + 1,
                        'label': label,
                        'centroid': (cX, cY),
                        'area': area
                    })
                    
                    # Draw UI tracking bounding circles and label indicators
                    cv2.circle(frame, (cX, cY), int(np.sqrt(area) + 4), (0, 255, 0), 1)
                    cv2.line(frame, (cX - 8, cY), (cX + 8, cY), (0, 255, 0), 1)
                    cv2.line(frame, (cX, cY - 8), (cX, cY + 8), (0, 255, 0), 1)
                    
                    cv2.putText(
                        frame, label, (cX + 12, cY - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1
                    )
        
        return frame, detections


def run_live_feed():
    """Start real-time web camera tracking feed."""
    detector = CelestialDetector(min_brightness=180)
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Web camera device unavailable.")
        return

    print("Celestial Detector Active. Press 'Q' to terminate camera stream.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        processed_frame, detected_objects = detector.process_frame(frame)
        
        # Render telemetry status HUD
        status_text = f"Celestial Bodies Tracked: {len(detected_objects)}"
        cv2.putText(
            processed_frame, status_text, (15, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2
        )

        cv2.imshow("Celestial Detection Stream", processed_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    run_live_feed()