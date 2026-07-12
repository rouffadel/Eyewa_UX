package com.ishaq.opticalpos;

import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Android 9–10: adjustResize is broken on budget WebViews (Exceed EX8S1) — use adjustPan.
 * Android 11+: adjustResize + Capacitor handles keyboard normally.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        int softInput =
            WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN
                | (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q
                    ? WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
                    : WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        getWindow().setSoftInputMode(softInput);
    }
}
