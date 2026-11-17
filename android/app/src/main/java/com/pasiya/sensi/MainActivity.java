package com.pasiya.sensi;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeCrosshairPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
