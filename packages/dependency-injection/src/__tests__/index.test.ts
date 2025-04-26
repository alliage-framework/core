import { Arguments, PrimitiveContainer } from '@alliage/framework';
import { describe, it, expect, afterEach, vi, MockInstance } from 'vitest';

import DependencyInjetionModule from '..';
import { ServiceContainer } from '../service-container';

vi.mock('../service-container');

describe('dependency-injection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DependencyInjectionModule', () => {
    const ServiceContainerMock = ServiceContainer as unknown as MockInstance;
    const addServiceMock = vi.fn();
    const setParameterMock = vi.fn();
    let serviceContainerMockInstance: ServiceContainer;
    ServiceContainerMock.mockImplementation(function ctorMock(this: ServiceContainer) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      serviceContainerMockInstance = this;
      this.addService = addServiceMock;
      this.setParameter = setParameterMock;
      return this;
    });
    const dim = new DependencyInjetionModule();
    it('should listen to the init kernel event', () => {
      expect(dim.getKernelEventHandlers()).toEqual({
        init: dim.onInit,
      });
    });

    describe('#onInit', () => {
      it('should add service container in the primitive container', () => {
        const pcMock = {
          set: vi.fn(),
        };
        dim.onInit(Arguments.create(), 'test', pcMock as unknown as PrimitiveContainer);

        expect(ServiceContainerMock).toHaveBeenCalled();
        expect(addServiceMock).toHaveBeenCalledWith(
          'service_container',
          serviceContainerMockInstance,
        );
        expect(setParameterMock).toHaveBeenCalledWith('environment', 'test');
        expect(pcMock.set).toHaveBeenCalledWith('service_container', serviceContainerMockInstance);
      });
    });
  });
}); 