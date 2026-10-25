# The upstream minio/mc image is no longer published; this pairs Chainguard's mc with a shell.
FROM cgr.dev/chainguard/minio-client:latest AS mc
FROM cgr.dev/chainguard/wolfi-base:latest
COPY --from=mc /usr/bin/mc /usr/bin/mc
ENTRYPOINT ["/bin/sh", "-c"]
