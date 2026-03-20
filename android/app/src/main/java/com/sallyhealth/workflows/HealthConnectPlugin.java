package com.sallyhealth.workflows;

import android.content.Context;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import androidx.annotation.NonNull;
import androidx.health.connect.client.HealthConnectClient;
import androidx.health.connect.client.PermissionController;
import androidx.health.connect.client.permission.HealthPermission;
import androidx.health.connect.client.records.HeightRecord;
import androidx.health.connect.client.records.StepsRecord;
import androidx.health.connect.client.records.WeightRecord;
import androidx.health.connect.client.request.ReadRecordsRequest;
import androidx.health.connect.client.response.ReadRecordsResponse;
import androidx.health.connect.client.time.TimeRangeFilter;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;
import kotlin.Result;
import kotlin.coroutines.Continuation;
import kotlin.coroutines.CoroutineContext;
import kotlin.coroutines.EmptyCoroutineContext;
import kotlin.jvm.JvmClassMappingKt;

@CapacitorPlugin(name = "HealthConnect")
public class HealthConnectPlugin extends Plugin {

    private HealthConnectClient getClient() {
        return HealthConnectClient.getOrCreate(getContext());
    }

    private Set<String> getRequiredPermissions() {
        Set<String> permissions = new HashSet<>();
        permissions.add(HealthPermission.getReadPermission(JvmClassMappingKt.getKotlinClass(StepsRecord.class)));
        permissions.add(HealthPermission.getReadPermission(JvmClassMappingKt.getKotlinClass(WeightRecord.class)));
        permissions.add(HealthPermission.getReadPermission(JvmClassMappingKt.getKotlinClass(HeightRecord.class)));
        return permissions;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        Context context = getContext();
        String providerPackageName = "com.google.android.apps.healthdata";
        int availabilityStatus = HealthConnectClient.getSdkStatus(context, providerPackageName);

        JSObject ret = new JSObject();
        String status;
        switch (availabilityStatus) {
            case HealthConnectClient.SDK_UNAVAILABLE:
                status = "SDK_UNAVAILABLE";
                break;
            case HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED:
                status = "SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED";
                break;
            case HealthConnectClient.SDK_AVAILABLE:
                status = "SDK_AVAILABLE";
                break;
            default:
                status = "UNKNOWN";
        }
        ret.put("status", status);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        Set<String> permissions = getRequiredPermissions();

        Intent intent = PermissionController.createRequestPermissionResultContract()
            .createIntent(getContext(), permissions);

        startActivityForResult(call, intent, "handlePermissionResult");
    }

    @ActivityCallback
    private void handlePermissionResult(PluginCall call, ActivityResult result) {
        getClient().getPermissionController().getGrantedPermissions(new Continuation<Set<String>>() {
            @NonNull
            @Override
            public CoroutineContext getContext() {
                return EmptyCoroutineContext.INSTANCE;
            }

            @Override
            public void resumeWith(@NonNull Object o) {
                if (o instanceof Result.Failure) {
                    call.reject("Error checking granted permissions: " + ((Result.Failure) o).exception.getMessage());
                } else {
                    Set<String> granted = (Set<String>) o;
                    Set<String> required = getRequiredPermissions();
                    
                    JSObject ret = new JSObject();
                    ret.put("allGranted", granted.containsAll(required));
                    
                    JSArray grantedArray = new JSArray();
                    for (String p : granted) {
                        grantedArray.put(p);
                    }
                    ret.put("grantedPermissions", grantedArray);
                    
                    call.resolve(ret);
                }
            }
        });
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        getClient().getPermissionController().getGrantedPermissions(new Continuation<Set<String>>() {
            @NonNull
            @Override
            public CoroutineContext getContext() {
                return EmptyCoroutineContext.INSTANCE;
            }

            @Override
            public void resumeWith(@NonNull Object o) {
                if (o instanceof Result.Failure) {
                    call.reject("Error checking permissions: " + ((Result.Failure) o).exception.getMessage());
                } else {
                    Set<String> granted = (Set<String>) o;
                    Set<String> required = getRequiredPermissions();
                    
                    JSObject ret = new JSObject();
                    ret.put("allGranted", granted.containsAll(required));
                    call.resolve(ret);
                }
            }
        });
    }

    @PluginMethod
    public void readSteps(PluginCall call) {
        try {
            Instant endTime = Instant.now();
            Instant startTime = endTime.minus(7, ChronoUnit.DAYS);

            ReadRecordsRequest<StepsRecord> request = new ReadRecordsRequest<>(
                JvmClassMappingKt.getKotlinClass(StepsRecord.class),
                TimeRangeFilter.between(startTime, endTime),
                new HashSet<>(),
                false,
                1000,
                null
            );

            getClient().readRecords(request, new Continuation<ReadRecordsResponse<StepsRecord>>() {
                @NonNull
                @Override
                public CoroutineContext getContext() {
                    return EmptyCoroutineContext.INSTANCE;
                }

                @Override
                public void resumeWith(@NonNull Object o) {
                    if (o instanceof Result.Failure) {
                        call.reject("Error reading steps: " + ((Result.Failure) o).exception.getMessage());
                    } else {
                        ReadRecordsResponse<StepsRecord> response = (ReadRecordsResponse<StepsRecord>) o;
                        JSArray stepsArray = new JSArray();
                        for (StepsRecord record : response.getRecords()) {
                            JSObject stepObj = new JSObject();
                            stepObj.put("count", record.getCount());
                            stepObj.put("startTime", record.getStartTime().toString());
                            stepObj.put("endTime", record.getEndTime().toString());
                            stepsArray.put(stepObj);
                        }
                        JSObject ret = new JSObject();
                        ret.put("records", stepsArray);
                        call.resolve(ret);
                    }
                }
            });
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void readWeight(PluginCall call) {
        try {
            Instant endTime = Instant.now();
            Instant startTime = endTime.minus(30, ChronoUnit.DAYS);

            ReadRecordsRequest<WeightRecord> request = new ReadRecordsRequest<>(
                JvmClassMappingKt.getKotlinClass(WeightRecord.class),
                TimeRangeFilter.between(startTime, endTime),
                new HashSet<>(),
                false,
                100,
                null
            );

            getClient().readRecords(request, new Continuation<ReadRecordsResponse<WeightRecord>>() {
                @NonNull
                @Override
                public CoroutineContext getContext() {
                    return EmptyCoroutineContext.INSTANCE;
                }

                @Override
                public void resumeWith(@NonNull Object o) {
                    if (o instanceof Result.Failure) {
                        call.reject("Error reading weight: " + ((Result.Failure) o).exception.getMessage());
                    } else {
                        ReadRecordsResponse<WeightRecord> response = (ReadRecordsResponse<WeightRecord>) o;
                        JSArray weightArray = new JSArray();
                        for (WeightRecord record : response.getRecords()) {
                            JSObject weightObj = new JSObject();
                            weightObj.put("weight", record.getWeight().getKilograms());
                            weightObj.put("time", record.getTime().toString());
                            weightArray.put(weightObj);
                        }
                        JSObject ret = new JSObject();
                        ret.put("records", weightArray);
                        call.resolve(ret);
                    }
                }
            });
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void readHeight(PluginCall call) {
        try {
            Instant endTime = Instant.now();
            Instant startTime = endTime.minus(365, ChronoUnit.DAYS);

            ReadRecordsRequest<HeightRecord> request = new ReadRecordsRequest<>(
                JvmClassMappingKt.getKotlinClass(HeightRecord.class),
                TimeRangeFilter.between(startTime, endTime),
                new HashSet<>(),
                false,
                10,
                null
            );

            getClient().readRecords(request, new Continuation<ReadRecordsResponse<HeightRecord>>() {
                @NonNull
                @Override
                public CoroutineContext getContext() {
                    return EmptyCoroutineContext.INSTANCE;
                }

                @Override
                public void resumeWith(@NonNull Object o) {
                    if (o instanceof Result.Failure) {
                        call.reject("Error reading height: " + ((Result.Failure) o).exception.getMessage());
                    } else {
                        ReadRecordsResponse<HeightRecord> response = (ReadRecordsResponse<HeightRecord>) o;
                        JSArray heightArray = new JSArray();
                        for (HeightRecord record : response.getRecords()) {
                            JSObject heightObj = new JSObject();
                            heightObj.put("height", record.getHeight().getMeters());
                            heightObj.put("time", record.getTime().toString());
                            heightArray.put(heightObj);
                        }
                        JSObject ret = new JSObject();
                        ret.put("records", heightArray);
                        call.resolve(ret);
                    }
                }
            });
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
